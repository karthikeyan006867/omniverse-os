/**
 * CLOUDINARY STORAGE SERVICE
 * Cloud-based file storage using Cloudinary
 */

export class CloudinaryStorage {
  private static instance: CloudinaryStorage;
  private cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  private apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '664188154834414';
  private uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

  private constructor() {}

  static getInstance(): CloudinaryStorage {
    if (!CloudinaryStorage.instance) {
      CloudinaryStorage.instance = new CloudinaryStorage();
    }
    return CloudinaryStorage.instance;
  }

  async uploadFile(file: File, folder: string = 'omniverse'): Promise<{
    url: string;
    publicId: string;
    size: number;
    format: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
      size: data.bytes,
      format: data.format,
    };
  }

  async uploadBase64(base64: string, folder: string = 'omniverse'): Promise<{
    url: string;
    publicId: string;
  }> {
    const formData = new FormData();
    formData.append('file', base64);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  }

  async deleteFile(publicId: string): Promise<boolean> {
    // Client-side deletion requires signed requests
    // For now, just return true - implement server-side deletion later
    console.log('Delete file:', publicId);
    return true;
  }

  getOptimizedUrl(url: string, width?: number, height?: number): string {
    if (!url) return '';
    
    const transformations = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push('c_limit', 'q_auto', 'f_auto');

    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
    }
    
    return url;
  }

  getThumbnailUrl(url: string): string {
    return this.getOptimizedUrl(url, 200, 200);
  }
}

export const cloudinaryStorage = CloudinaryStorage.getInstance();
