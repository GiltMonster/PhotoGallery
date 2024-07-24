import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from "@capacitor/preferences";
import { UserPhoto } from "../interfaces/userPhoto";
import { Platform } from "@ionic/angular";
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = "photos";
  private platform: Platform;

  constructor(
    platform: Platform
  ) {
    this.platform = platform;
    console.log(this.platform.platforms());

  }

  public async addToGallery() {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // file-based data; provides best performance
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 100 // highest quality (0 to 100)
    });

    // Save the picture and add it to photo collection
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

    console.log(JSON.stringify(this.photos));

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    })
  }

  public async loadSaved() {
    // Retrieve cached photo array data
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];

    // Easiest way to detect when running on the web:
    // "when the platform is NOT hybrid, do this"
    if (!this.platform.is('hybrid')) {

      // Display the photo by reading into base64 format
      for (let photo of this.photos) {
        // Read each saved photo's data from the Filesystem
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });

        // Web platform only: Load the photo as base64 data
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }

  private async savePicture(cameraPhoto: Photo) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readBase64(cameraPhoto);

    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webview#file-protocol

      return {
        filepath: fileName,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri)
      }
    } else {
      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: cameraPhoto.webPath
      }
    }
  }

  private async readBase64(photo: Photo) {
    // "hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')) {
      // read the file into base64 format
      const file = await Filesystem.readFile({
        path: photo.path!
      });

      return file.data;
    } else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();

      return await this.convertBlobToBase64(blob) as string
    }

  }

  private convertBlobToBase64(blob: Blob) {
    return new Promise((resolve, reject) => {
      const render = new FileReader();
      render.onerror = reject;
      render.onload = () => {
        resolve(render.result)
      };
      render.readAsDataURL(blob);
    });
  }


}
