const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBRrtananBMNRUU43Udn04Y-vQ7mlrJ5vo",
    authDomain: "algotradingdb.firebaseapp.com",
    projectId: "algotradingdb",
    storageBucket: "algotradingdb.appspot.com",
    messagingSenderId: "680703939506",
    appId: "1:680703939506:web:8dc2056b53a53bc5d9caab",
    measurementId: "G-J8ZGEKQEN4"
  }



initializeApp(firebaseConfig);

export const db = getFirestore();

export function dbConnect(){
    if(db){
        console.log("Database connected sucessfully")
    } else{
        console.log("Failed connection")
    }
}