import { Component, OnInit } from '@angular/core';
// import { App as CapacitorApp } from '@capacitor/app';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'hw2p';

  ngOnInit(){
    // this.backButton()
  }
  // backButton() {
  //   CapacitorApp.addListener('backButton', ({ canGoBack }) => {
  //     if (!canGoBack) {
  //       CapacitorApp.exitApp()
  //     }
  //     else
  //       if (canGoBack) {
  //         window.history.back();
  //       }
  //   })
  // }

}
