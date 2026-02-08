import sharp from 'sharp';

// Magic bytes for image validation
const IMAGE_MAGIC_BYTES: Record<string, Buffer[]> = {
    'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
    'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
    'image/gif': [Buffer.from([0x47, 0x49, 0x46, 0x38])],
    'image/webp': [Buffer.from([0x52, 0x49, 0x46, 0x46])], // RIFF header
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const OUTPUT_SIZE = 200; // 200x200 pixels
const OUTPUT_QUALITY = 80; // WebP quality

export interface ImageValidationResult {
    valid: boolean;
    error?: string;
}

export interface ProcessedImage {
    dataUrl: string;
    mimeType: string;
    sizeBytes: number;
}

/**
 * Validate image file type and size
 */
export function validateImageFile(
    buffer: Buffer,
    mimeType: string,
    fileSize: number,
): ImageValidationResult {
    // Check file size
    if (fileSize > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        };
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        };
    }

    // Verify magic bytes
    const magicBytes = IMAGE_MAGIC_BYTES[mimeType];
    if (magicBytes) {
        const headerBytes = buffer.subarray(0, 12);
        const isValid = magicBytes.some((magic) =>
            headerBytes.subarray(0, magic.length).equals(magic),
        );

        if (!isValid) {
            return {
                valid: false,
                error: 'File contents do not match declared file type',
            };
        }
    }

    return { valid: true };
}

/**
 * Process and resize image to 200x200 WebP format
 * Strips all metadata (EXIF, GPS, etc) for security
 */
export async function processProfileImage(buffer: Buffer): Promise<ProcessedImage> {
    // Process with Sharp - resize to 200x200, convert to WebP
    const processedBuffer = await sharp(buffer)
        .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
            fit: 'cover', // Crop to fill the square
            position: 'center',
        })
        .webp({ quality: OUTPUT_QUALITY })
        .toBuffer();

    // Convert to base64 data URL
    const base64 = processedBuffer.toString('base64');
    const dataUrl = `data:image/webp;base64,${base64}`;

    return {
        dataUrl,
        mimeType: 'image/webp',
        sizeBytes: processedBuffer.length,
    };
}
