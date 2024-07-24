import { Component, OnInit } from '@angular/core';
import { PhotoService } from "../services/photo.service";
import { ActionSheetController } from '@ionic/angular';
import { UserPhoto } from '../interfaces/userPhoto';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {

  constructor(
    public photoService: PhotoService,
    public actionSheetController: ActionSheetController
  ) { }

  ngOnInit(): void {
    this.photoService.loadSaved();
  }

  addPhotoToGallery() {
    this.photoService.addToGallery();
  }

  public async showActionSheet(photo: UserPhoto, position: number) {
    const action = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.photoService.deletePicture(photo, position);
        }
      },
      {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          // Nothing to do, action sheet will automatically close
        }
      }]
    });
    await action.present();
  }

}
