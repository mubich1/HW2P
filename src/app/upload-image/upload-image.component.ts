import { Component, OnInit } from '@angular/core';
import { createWorker } from 'tesseract.js';
import { Camera, CameraResultType, CameraSource, ImageOptions, Photo } from '@capacitor/camera';
import { ActivatedRoute, Router } from '@angular/router';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { LocalStorageService } from '../shared/localstorage.service';
import { Share } from '@capacitor/share';
import { MatDialog } from '@angular/material/dialog';
import { ImagePreviewComponent } from '../image-preview/image-preview.component';
import { isPlatform } from '@ionic/angular';
import { PreviewAnyFile } from '@ionic-native/preview-any-file/ngx';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { Capacitor } from '@capacitor/core';

declare var cv: any;
declare var tf: any;
@Component({
  selector: 'app-upload-image',
  templateUrl: './upload-image.component.html',
  styleUrls: ['./upload-image.component.scss']
})
export class UploadImageComponent implements OnInit {
  ocrResult: any = '';
  fileList: any[] = [];
  worker: Tesseract.Worker;
  workerReady = false;
  captureProgress = 0;
  displayStyle = "none";
  displayStyleRename = "none"
  imageWithResult: any;
  oldFileName: any
  currentFolder: string = '';
  predicted: string = "";
  constructor(private route: Router,
    private localstorageservic: LocalStorageService,
    private matdialogopen: MatDialog,
    private router: ActivatedRoute,
    private previewAnyFile: PreviewAnyFile,
  ) { }

  ngOnInit(): void {
    this.currentFolder = this.router.snapshot.paramMap.get('folder') || '';
    this.loadWorker()
    this.fileList = JSON.parse(localStorage.getItem('uploadedImage') || '[]')

    // use await in other code

  }

  async makePrediction(img: any) {
    let index_to_char = "אבגדהוזחטיכךלמםנןסעפףצץקרשת";
    let pred;
    const model = await tf.loadLayersModel('../../assets/model.json');
    pred = await model.predict(img).argMax(-1).data();
    this.predicted += index_to_char.charAt(pred[0]);
    // console.log(this.predicted)
  }

  detect_text(imgInput: any) {
    let dst = new cv.Mat();
    let thr = new cv.Mat();
    // console.log(imgInput,"IN");
    let inputImage = cv.imread(imgInput);
    // console.log(inputImage,"OUT");
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    var filtered_contours = new cv.MatVector();;

    cv.cvtColor(inputImage, dst, cv.COLOR_RGB2GRAY, 0);
    cv.threshold(dst, dst, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    let M = cv.Mat.ones(3, 3, cv.CV_8U);
    let anchor = new cv.Point(0, 0);
    cv.erode(dst, thr, M, anchor, 3);
    cv.findContours(thr, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); ++i) {
      if (hierarchy.intPtr(0, i)[1] > -1) {
        filtered_contours.push_back(contours.get(i))
      }
    }

    //Get area for all contours so we can find the biggest
    let sortableContours = [];
    for (let i = 0; i < filtered_contours.size(); i++) {
      let cnt = filtered_contours.get(i);
      let rect = cv.boundingRect(cnt);
      sortableContours.push({ x: rect['x'], contour: cnt });
    }
    sortableContours = sortableContours.sort((item1, item2) => { return (item1.x > item2.x) ? -1 : (item1.x < item2.x) ? 1 : 0; });
    this.predicted = ""
    for (let i = 0; i < sortableContours.length; i++) {
      let rect = cv.boundingRect(sortableContours[i]['contour'])
      if (rect.width > 10 && rect.width < 100 && rect.height > 10) {
        let patch = dst.roi(rect)
        cv.resize(patch, patch, new cv.Size(28, 28));
        // cv.imshow("c" + (i + 1), patch)
        let img = tf.tensor(patch.data.map(function (item: any) { return item / 255 }), [1, patch.rows, patch.cols, 1])
        this.makePrediction(img)
      }
    }
    // console.log(this.predicted)
    // this.openPopup()

  }

  viewImge(img: ImageCroppedEvent) {
    this.matdialogopen.open(ImagePreviewComponent, { data: img })
  }

  async loadWorker() {
    this.worker = createWorker({
      logger: progress => {
        if (progress.status == 'recognizing text') {
          this.captureProgress = parseInt('' + progress.progress * 100)
        }
      }
    });
    await this.worker.load();
    await this.worker.loadLanguage('heb');
    await this.worker.initialize('heb');
  }
  // async loadFileData(fileNames: string[]) {
  //   for (let f of fileNames) {
  //     const filePath = `${IMAGE_DIR}/${f}`;
 
  //     const readFile = await Filesystem.readFile({
  //       path: filePath,
  //       directory: Directory.Data,
  //     });
 
  //     this.images.push({
  //       name: f,
  //       path: filePath,
  //       data: `data:image/jpeg;base64,${readFile.data}`,
  //     });
  //   }
  // }
  async doOCR(file: any) {
    // console.log(file.name)
    let out: any = await this.detect_text(String(file.name));
    // console.log(text,"text");
    // text = this.predicted;
    this.openPopup();
  
  }

  convert(text: any) {
    const canvas: any = document.getElementById('mycanvas');
    const ctx = canvas.getContext('2d');
    ctx.font = '30px Arial';
    ctx.fillStyle = "white";
    ctx.fillText(this.predicted, 100, 50);
    let img = canvas.toDataURL('image/png');
    const fileName = new Date().getTime()
    Filesystem.writeFile({
      path: `Text Picture/${fileName}.png`,
      data: img,
      directory: Directory.Documents,
      recursive: true
    })
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }


  /**
  * choose picture and display
  */
  pickImageFromGallery() {
    const options: any = {
      source: CameraSource.Photos,
      resultType: CameraResultType.DataUrl,
      allowEditing: true
    }
    Camera.getPhoto(options).then(
      (result: any) => {
        // console.log(result);
        const date = new Date().getTime()
        const data = { data: result.dataUrl, name: date }
        this.fileList.push(data)
        localStorage.setItem('uploadedImage', JSON.stringify(this.fileList))
      },
      (err: any) => {
        alert(err);
      }
    );
  }

  async openCamera() {
    const image: any = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      saveToGallery: true,
      source: CameraSource.Camera
    })

    const base64 = image.dataUrl
    const date = new Date().getTime()
    const data = { data: base64, name: date }
    this.fileList.push(data)
    localStorage.setItem('uploadedImage', JSON.stringify(this.fileList))
  }

  async saveTextDoc() {
    const date = new Date().getTime()
    await Filesystem.writeFile({
      path: `HW2P OCR/${date}.txt`,
      data: this.ocrResult,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true
    }).then(res => {
      this.openFile(res)
    }, (err) => {
      alert(err)
    })
    this.closePopup();
  }

  async openFile(entry: any) {
    if (isPlatform('hybrid')) {
      this.previewAnyFile.preview(entry.uri)
      .then((res: any) => { alert(res) })
      .catch((error: any) => alert(error));
    }
  }

  shareImage(file: any) {
    Filesystem.writeFile({
      path: 'cache' + file.name + '.jpg',
      data: file.data,
      directory: Directory.Cache
    }).then(res => {
      Share.share({
        title: 'share image',
        url: res.uri
      })
    })
  }

  navigateToHome() {
    this.route.navigate(['/home'])
  }

  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }

  deletePhoto(data: any) {
    this.fileList.splice(data, 1);
    this.localstorageservic.set('uploadedImage', this.fileList)
  }

  changeName(value: any) {
    this.fileList.forEach(res => {
      if (res.name == this.oldFileName) {
        res.name = value.folder
      }
    })
    localStorage.setItem('uploadedImage', JSON.stringify(this.fileList))
    this.closeRenamePopUp();

  }
  openPopupRename(fileName: any) {
    this.oldFileName = fileName.name
    this.displayStyleRename = "block";
  }
  closeRenamePopUp() {
    this.displayStyleRename = "none"
  }

}
