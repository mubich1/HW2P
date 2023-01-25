import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { PreviewAnyFile } from '@ionic-native/preview-any-file/ngx';
import { AlertController, isPlatform, ToastController } from '@ionic/angular';
import write_blob from 'capacitor-blob-writer';
import { ImagePreviewComponent } from '../image-preview/image-preview.component';

const APP_DIRECTORY = Directory.Documents;

@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.scss']
})
export class FolderComponent implements OnInit {
  currentFolder: string = '';
  folderName: any
  folderLists: any[] = [];
  copyFile: any;
  folder = false
  displayStyle = "none";
  isFolder = false;

  @ViewChild('filepicker') uploader: ElementRef;
  
  constructor(private router: Router,
    private route: ActivatedRoute,
    private previewAnyFile: PreviewAnyFile,
    private toastCtrl: ToastController,
    private matdialogopen: MatDialog,) { }

  ngOnInit(): void {
    this.currentFolder = this.route.snapshot.paramMap.get('folder') || '';
    this.loadDocuments()
    this.route.queryParams.subscribe(res => {
      this.isFolder = res['data']
    })
  }

  addFile() {
    this.uploader.nativeElement.click();
    this.loadDocuments()
  }

  async fileSelected($event: any) {
    const selected = $event.target.files[0];

    await write_blob({
      directory: APP_DIRECTORY,
      path: `${this.currentFolder}/${selected.name}`,
      blob: selected,
      on_fallback(error) {
        console.error('error: ', error);
      }
    });

    this.loadDocuments();
  }

  async file() {
    await Filesystem.writeFile({
      path: 'OCR text/.txt',
      data: 'data',
      directory: APP_DIRECTORY,
      encoding: Encoding.UTF8,
      recursive: true
    }).then(res => {
      // alert(JSON.stringify(res))
    }, (err) => {
      alert(err)
    });
  }

  async createFolder() {
    if (this.folderName) {
      await Filesystem.mkdir({
        path: `${this.currentFolder}/${this.folderName}`,
        directory: Directory.Documents,
        recursive: true,
      }).then(res => {
        // alert(JSON.stringify(res))      
      }, (err) => {
        alert(err)
      })
      this.loadDocuments()
    }
  }

  async loadDocuments() {
    const folderContent = await Filesystem.readdir({
      directory: APP_DIRECTORY,
      path: this.currentFolder
    });
    // The directory array is just strings
    // We add the information isFile to make life easier
    this.folderLists = folderContent.files.map(file => {
      return {
        name: file,
        isFile: file.includes('.')
      }
    });
  }

  async delete(entry: any) {
    console.log('entry: ', entry);
    if (entry.isFile) {
      await Filesystem.deleteFile({
        directory: APP_DIRECTORY,
        path: this.currentFolder + '/' + entry.name
      });
    } else {
      await Filesystem.rmdir({
        directory: APP_DIRECTORY,
        path: this.currentFolder + '/' + entry.name,

        recursive: true // Removes all files as well!
      });
    }
    this.loadDocuments();
  }

  navigateToHome() {
    this.folder = false
    this.router.navigate(['/home'])
    // window.history.back()
  }

  submitForm(form: any) {
    this.folderName = form;
    this.loadDocuments()
    this.folderName = '';
  }

  startCopy(file: any) {
    this.copyFile = file;
  }

  async finishCopyFile(entry: any) {
    // Make sure we don't have any additional slash in our path
    const current = this.currentFolder != '' ? `/${this.currentFolder}` : ''

    const from_uri = await Filesystem.getUri({
      directory: APP_DIRECTORY,
      path: `${current}/${this.copyFile.name}`
    });

    const dest_uri = await Filesystem.getUri({
      directory: APP_DIRECTORY,
      path: `${current}/${entry.name}/${this.copyFile.name}`
    });

    await Filesystem.copy({
      from: from_uri.uri,
      to: dest_uri.uri
    });
    this.copyFile = null;
    this.loadDocuments();
  }

  async itemClicked(entry: any) {
    this.folder = true


    if (this.copyFile) {
      // We can only copy to a folder
      if (entry.isFile) {
        let toast = await this.toastCtrl.create({
          message: 'Please select a folder for your operation'
        });
        await toast.present();
        return;
      }
      // Finish the ongoing operation
      this.finishCopyFile(entry);

    } else {
      // Open the file or folder
      if (entry.isFile) {
        this.openFile(entry);
      } else {
        let pathToOpen =
          this.currentFolder != '' ? this.currentFolder + '/' + entry.name : entry.name;
        let folder = encodeURIComponent(pathToOpen);
        this.folder = true
        this.router.navigateByUrl(`/folder/${folder}`);
      }
    }
    this.loadDocuments()
  }

  last() {
    this.folder = false
    console.log(this.folder);

    this.router.navigateByUrl('/folder');
  }

  async openFile(entry: any) {
    if (isPlatform('hybrid')) {

      // Get the URI and use our Cordova plugin for preview
      const file_uri = await Filesystem.getUri({
        directory: APP_DIRECTORY,
        path: this.currentFolder + '/' + entry.name
      })

      this.previewAnyFile.preview(file_uri.uri)
        // .then((res: any) => {alert(res)})
        .catch((error: any) => alert(error));
    }
    else {
      // Browser fallback to download the file
      const file = await Filesystem.readFile({
        directory: APP_DIRECTORY,
        path: this.currentFolder + '/' + entry.name
      });

      const blob: any = this.b64toBlob(file.data, '');
      const blobUrl = window.URL.createObjectURL(blob);

      let a = document.createElement('a');
      document.body.appendChild(a);
      a.setAttribute('style', 'display: none');
      a.href = blobUrl;
      a.download = entry.name;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
    }
  }

  b64toBlob = (b64Data: any, contentType = '', sliceSize = 512) => { }

  // Rename folder 
  async renameFile(old: any, newName: any) {
    await Filesystem.rename({
      from: old,
      to: newName,
      directory: Directory.Documents,
    }).then(res => {
      this.loadDocuments()
      alert(JSON.stringify(res))
    }, )
    // (err) => {
    //   alert(`[error of rename${err}]`)
    // })

  }

  changeFolderName: any
  openPopup(folder: any) {
    this.changeFolderName = folder.name
    this.displayStyle = "block";
  }

  changeName(value: any) {
    const newName = value.folder
    this.renameFile(this.changeFolderName, newName)
    this.closePopup()
  }
  closePopup() {
    this.displayStyle = "none";
  }

  async shareFile(entry: any) {
    const file_uri: any = await Filesystem.getUri({
      directory: APP_DIRECTORY,
      path: this.currentFolder + '/' + entry.name
    }).then(res => {
      Share.share({
        title: 'share image',
        url: res.uri
      })
    },(err) => {alert(err)})
  }
}
