// Import the functions you need from the SDKs you need

const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { models } = require("mongoose");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDeDlJSWUPr3CDVbUoxA-Ag_FKnAS3GOi0",
    authDomain: "rutinapp-cadc1.firebaseapp.com",
    projectId: "rutinapp-cadc1",
    storageBucket: "rutinapp-cadc1.appspot.com",
    messagingSenderId: "837394216188",
    appId: "1:837394216188:web:db9045a5cb6e18618dd379",
    measurementId: "G-98CE05FZG6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
module.exports = app;
