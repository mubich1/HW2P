import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FolderComponent } from './folder/folder.component';
import { UploadImageComponent } from './upload-image/upload-image.component';

const routes: Routes = [
  {
    path : '',
    redirectTo : 'home',
    pathMatch : 'full' 
  },
  {
    path : 'home',
    component : HomeComponent
  },
  {
    path : 'folder',
    component : FolderComponent
  },
  {
    path : 'folder/:folder',
    component : FolderComponent
  },
  {
    path : 'upload',
    component : UploadImageComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
