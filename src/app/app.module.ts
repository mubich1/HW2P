import { ErrorHandler, Injectable, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { FolderComponent } from './folder/folder.component';
import { UploadImageComponent } from './upload-image/upload-image.component';
import { PreviewAnyFile } from '@ionic-native/preview-any-file/ngx';
import { ImagePreviewComponent } from './image-preview/image-preview.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { ImageCropperModule } from 'ngx-image-cropper';

// Global error detector 
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor() { }
  handleError(error: any) {
    alert(error)
  }
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    FolderComponent,
    UploadImageComponent,
    ImagePreviewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    MatDialogModule,
    ImageCropperModule
  ],
  providers: [
    PreviewAnyFile,
    { provide: ErrorHandler, useClass: GlobalErrorHandler } 
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
