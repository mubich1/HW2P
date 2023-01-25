import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-image-preview',
  templateUrl: './image-preview.component.html',
  styleUrls: ['./image-preview.component.scss']
})
export class ImagePreviewComponent implements OnInit {
img=''
  constructor(private matdialogopen:MatDialog,
    private matDialogRef: MatDialogRef<ImagePreviewComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {     
      this.img = data.data;
    
  }

  ngOnInit(): void {
  }
  closeDialog(){
    this.matdialogopen.closeAll()
  }
}
