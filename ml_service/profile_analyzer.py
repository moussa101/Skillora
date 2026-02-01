"""
Profile Analyzer Module
Extracts and analyzes GitHub/LinkedIn profiles from resume text
"""

import re
import os
import httpx
from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import asyncio


@dataclass
class GitHubProfile:
    """GitHub profile data"""
    username: str
    name: Optional[str] = None
    bio: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    email: Optional[str] = None
    public_repos: int = 0
    followers: int = 0
    following: int = 0
    created_at: Optional[str] = None
    
    # Computed from repos
    total_stars: int = 0
    top_languages: List[str] = field(default_factory=list)
    recent_commits: int = 0
    pinned_repos: List[Dict] = field(default_factory=list)
    notable_repos: List[Dict] = field(default_factory=list)


@dataclass
class ProfileAnalysisResult:
    """Combined profile analysis result"""
    github: Optional[GitHubProfile] = None
    linkedin_url: Optional[str] = None
    profile_score: float = 0.0
    profile_insights: List[str] = field(default_factory=list)
    urls_found: Dict[str, str] = field(default_factory=dict)


class ProfileAnalyzer:
    """Analyzes external profiles from resume"""
    
    # Regex patterns for URL extraction
    GITHUB_PATTERN = r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})(?:/)?(?!\S)'
    LINKEDIN_PATTERN = r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)/?'
    URL_PATTERN = r'https?://[^\s<>"{}|\\^`\[\]]+'
    
    def __init__(self, github_token: Optional[str] = None):
        """
        Initialize with optional GitHub token for higher rate limits.
        Without token: 60 requests/hour
        With token: 5000 requests/hour
        """
        self.github_token = github_token or os.getenv("GITHUB_TOKEN")
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AI-Resume-Analyzer/1.0"
        }
        if self.github_token:
            self.headers["Authorization"] = f"token {self.github_token}"
    
    def extract_urls(self, text: str) -> Dict[str, Optional[str]]:
        """Extract GitHub and LinkedIn URLs from text"""
        urls = {
            "github": None,
            "github_username": None,
            "linkedin": None,
            "linkedin_username": None,
            "other_urls": []
        }
        
        # Find GitHub
        github_match = re.search(self.GITHUB_PATTERN, text, re.IGNORECASE)
        if github_match:
            username = github_match.group(1)
            urls["github"] = f"https://github.com/{username}"
            urls["github_username"] = username
        
        # Find LinkedIn
        linkedin_match = re.search(self.LINKEDIN_PATTERN, text, re.IGNORECASE)
        if linkedin_match:
            username = linkedin_match.group(1)
            urls["linkedin"] = f"https://linkedin.com/in/{username}"
            urls["linkedin_username"] = username
        
        # Find other URLs
        all_urls = re.findall(self.URL_PATTERN, text)
        for url in all_urls:
            if "github.com" not in url.lower() and "linkedin.com" not in url.lower():
                urls["other_urls"].append(url)
        
        return urls
    
    async def fetch_github_profile(self, username: str) -> Optional[GitHubProfile]:
        """Fetch GitHub profile data via REST API"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Fetch user profile
                user_response = await client.get(
                    f"https://api.github.com/users/{username}",
                    headers=self.headers
                )
                
                if user_response.status_code == 404:
                    return None
                
                if user_response.status_code != 200:
                    print(f"GitHub API error: {user_response.status_code}")
                    return None
                
                user_data = user_response.json()
                
                profile = GitHubProfile(
                    username=username,
                    name=user_data.get("name"),
                    bio=user_data.get("bio"),
                    company=user_data.get("company"),
                    location=user_data.get("location"),
                    email=user_data.get("email"),
                    public_repos=user_data.get("public_repos", 0),
                    followers=user_data.get("followers", 0),
                    following=user_data.get("following", 0),
                    created_at=user_data.get("created_at")
                )
                
                # Fetch repositories for additional analysis
                repos_response = await client.get(
                    f"https://api.github.com/users/{username}/repos",
                    headers=self.headers,
                    params={"sort": "updated", "per_page": 30}
                )
                
                if repos_response.status_code == 200:
                    repos = repos_response.json()
                    await self._analyze_repos(profile, repos, client)
                
                return profile
                
        except httpx.TimeoutException:
            print(f"Timeout fetching GitHub profile for {username}")
            return None
        except Exception as e:
            print(f"Error fetching GitHub profile: {e}")
            return None
    
    async def _analyze_repos(self, profile: GitHubProfile, repos: List[Dict], client: httpx.AsyncClient):
        """Analyze user repositories"""
        languages = {}
        total_stars = 0
        notable_repos = []
        
        for repo in repos:
            # Count stars
            stars = repo.get("stargazers_count", 0)
            total_stars += stars
            
            # Track languages
            lang = repo.get("language")
            if lang:
                languages[lang] = languages.get(lang, 0) + 1
            
            # Track notable repos (starred or forked)
            if stars >= 1 or repo.get("forks_count", 0) >= 1:
                notable_repos.append({
                    "name": repo.get("name"),
                    "description": repo.get("description", "")[:100] if repo.get("description") else "",
                    "stars": stars,
                    "forks": repo.get("forks_count", 0),
                    "language": lang,
                    "url": repo.get("html_url")
                })
        
        # Sort languages by frequency
        sorted_languages = sorted(languages.items(), key=lambda x: x[1], reverse=True)
        profile.top_languages = [lang for lang, count in sorted_languages[:5]]
        profile.total_stars = total_stars
        profile.notable_repos = sorted(notable_repos, key=lambda x: x["stars"], reverse=True)[:5]
        
        # Check recent activity (commits in last 30 days)
        try:
            events_response = await client.get(
                f"https://api.github.com/users/{profile.username}/events",
                headers=self.headers,
                params={"per_page": 100}
            )
            
            if events_response.status_code == 200:
                events = events_response.json()
                thirty_days_ago = datetime.now() - timedelta(days=30)
                
                recent_commits = 0
                for event in events:
                    if event.get("type") == "PushEvent":
                        event_date = datetime.fromisoformat(event["created_at"].replace("Z", "+00:00"))
                        if event_date.replace(tzinfo=None) > thirty_days_ago:
                            commits = event.get("payload", {}).get("commits", [])
                            recent_commits += len(commits)
                
                profile.recent_commits = recent_commits
        except Exception:
            pass  # Non-critical, continue without recent activity
    
    def calculate_profile_score(self, github: Optional[GitHubProfile]) -> tuple[float, List[str]]:
        """
        Calculate a profile strength score (0-100) based on GitHub data.
        Returns (score, insights)
        """
        insights = []
        
        if not github:
            return 0.0, ["No GitHub profile found or accessible"]
        
        score = 0.0
        
        # Account age (up to 10 points)
        if github.created_at:
            try:
                created = datetime.fromisoformat(github.created_at.replace("Z", "+00:00"))
                years = (datetime.now(created.tzinfo) - created).days / 365
                age_score = min(years * 2, 10)
                score += age_score
                if years >= 3:
                    insights.append(f"Established account ({int(years)} years)")
            except Exception:
                pass
        
        # Repository count (up to 15 points)
        repos = github.public_repos
        if repos >= 20:
            score += 15
            insights.append(f"Active developer ({repos} public repos)")
        elif repos >= 10:
            score += 10
            insights.append(f"{repos} public repositories")
        elif repos >= 5:
            score += 5
        
        # Stars (up to 20 points)
        stars = github.total_stars
        if stars >= 100:
            score += 20
            insights.append(f"Popular projects ({stars} total stars)")
        elif stars >= 50:
            score += 15
            insights.append(f"Well-received projects ({stars} stars)")
        elif stars >= 10:
            score += 10
        elif stars >= 1:
            score += 5
        
        # Followers (up to 15 points)
        followers = github.followers
        if followers >= 100:
            score += 15
            insights.append(f"Strong community presence ({followers} followers)")
        elif followers >= 50:
            score += 10
        elif followers >= 10:
            score += 5
        
        # Language diversity (up to 10 points)
        langs = len(github.top_languages)
        if langs >= 4:
            score += 10
            insights.append(f"Polyglot developer ({', '.join(github.top_languages[:4])})")
        elif langs >= 2:
            score += 5
            insights.append(f"Works with {', '.join(github.top_languages[:3])}")
        elif langs >= 1:
            score += 2
            insights.append(f"Primary language: {github.top_languages[0]}")
        
        # Recent activity (up to 15 points)
        commits = github.recent_commits
        if commits >= 50:
            score += 15
            insights.append(f"Very active ({commits} commits in last 30 days)")
        elif commits >= 20:
            score += 10
            insights.append(f"Active contributor ({commits} recent commits)")
        elif commits >= 5:
            score += 5
        elif commits == 0:
            insights.append("No recent public activity")
        
        # Notable projects (up to 15 points)
        notable = len(github.notable_repos)
        if notable >= 3:
            score += 15
            top_repo = github.notable_repos[0]
            insights.append(f"Notable: {top_repo['name']} ({top_repo['stars']} stars)")
        elif notable >= 1:
            score += 8
        
        # Bio completeness (up to 5 points)
        if github.bio:
            score += 3
        if github.company:
            score += 2
        
        return min(score, 100.0), insights
    
    async def analyze(self, resume_text: str) -> ProfileAnalysisResult:
        """
        Full profile analysis from resume text.
        Extracts URLs and fetches available profile data.
        """
        # Extract URLs
        urls = self.extract_urls(resume_text)
        
        result = ProfileAnalysisResult(
            urls_found=urls
        )
        
        # Analyze GitHub if found
        if urls.get("github_username"):
            github_profile = await self.fetch_github_profile(urls["github_username"])
            if github_profile:
                result.github = github_profile
                score, insights = self.calculate_profile_score(github_profile)
                result.profile_score = score
                result.profile_insights = insights
        
        # Note LinkedIn URL for reference (no scraping)
        if urls.get("linkedin"):
            result.linkedin_url = urls["linkedin"]
            if not result.profile_insights:
                result.profile_insights = []
            result.profile_insights.append(f"LinkedIn profile available")
        
        return result


# Synchronous wrapper for non-async contexts
def analyze_profile_sync(resume_text: str, github_token: Optional[str] = None) -> ProfileAnalysisResult:
    """Synchronous wrapper for profile analysis"""
    analyzer = ProfileAnalyzer(github_token)
    return asyncio.run(analyzer.analyze(resume_text))


# Convenience function
def get_profile_analyzer(github_token: Optional[str] = None) -> ProfileAnalyzer:
    """Get a configured profile analyzer instance"""
    return ProfileAnalyzer(github_token)
