import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: "AIzaSyDQxGD5KEPrBkPMJnktoL9bwf9iPKyrEkQ",
  authDomain: "trading-86050.firebaseapp.com",
  projectId: "trading-86050",
  storageBucket: "trading-86050.firebasestorage.app",
  messagingSenderId: "951816765324",
  appId: "1:951816765324:web:afe6b7dae5532623cf60a9",
  measurementId: "G-H7BPFNE6MJ",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const currency = collection(db,"Currency")
// export const eurusdDoc = getDoc("EURUSD")
// get

export function dbConnect() {
  if (db) {
    console.log("Database connected sucessfully");
  } else {
    console.log("Failed connection");
  }
}
