'use strict';
// Never reload an unfinished edit to install an update.
if('serviceWorker' in navigator&&window.isSecureContext){
 window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').then(reg=>{
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)reg.update().catch(()=>{})});
 }).catch(()=>{}));
}
