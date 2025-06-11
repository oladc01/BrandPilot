// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCG-oLZ9i4PjW_onVTyDHJAttCYefzVHAI",
  authDomain: "brandpilot-c083d.firebaseapp.com",
  projectId: "brandpilot-c083d",
  storageBucket: "brandpilot-c083d.appspot.com",
  messagingSenderId: "94968258445",
  appId: "1:94968258445:web:a29afc554d2cecb0b927c4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===========================
// Signup Handler
// ===========================
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = signupForm['fullname'].value.trim();
    const email = signupForm['email'].value.trim();
    const password = signupForm['password'].value;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Store user info in Firestore
      await setDoc(doc(db, "users", cred.user.uid), {
        fullName: fullName,
        email: email
      });

      alert("Signup successful!");
      window.location.href = "dashboard.html";
    } catch (err) {
      alert("Signup failed: " + err.message);
    }
  });
}

// ===========================
// Login Handler
// ===========================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Login successful!");
        window.location.href = "dashboard.html";
      })
      .catch((error) => {
        alert("Login failed: " + error.message);
      });
  });
}
// ===========================
// Logout Handler
// ===========================
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        alert("Logged out!");
        window.location.href = "index.html";
      })
      .catch((err) => {
        alert("Logout failed: " + err.message);
      });
  });

 
// Handle Auth State
onAuthStateChanged(auth, (user) => {
  if (window.location.pathname.includes("dashboard.html")) {
    if (user) {
      // Load user's posts
      loadScheduledPosts(user);

      // Schedule post form
      const postForm = document.getElementById("postForm");
      if (postForm) {
        postForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const content = document.getElementById("postContent").value;
          const date = document.getElementById("postDate").value;

          if (!content || !date) {
            alert("Please fill out both fields.");
            return;
          }

          try {
            await addDoc(collection(db, "users", user.uid, "posts"), {
              content,
              date,
              createdAt: new Date().toISOString()
            });
            postForm.reset();
            loadScheduledPosts(user);
          } catch (err) {
            alert("Error saving post: " + err.message);
          }
        });
      }

    } else {
      window.location.href = "index.html"; // Not logged in
    }
  }
});

// Load and display scheduled posts
async function loadScheduledPosts(user) {
  const postList = document.getElementById("postList");
  if (!postList) return;
  postList.innerHTML = "<li>Loading...</li>";

  try {
    const userPostsRef = collection(db, "users", user.uid, "posts");
    const querySnapshot = await getDocs(userPostsRef);

    if (querySnapshot.empty) {
      postList.innerHTML = "<li>No scheduled posts yet.</li>";
      return;
    }

    let html = "";
    querySnapshot.forEach(doc => {
      const post = doc.data();
      html += `
        <li>
          <strong>${post.content}</strong><br/>
          <small>📅 ${new Date(post.date).toLocaleString()}</small>
        </li>
      `;
    });

    postList.innerHTML = html;
  } catch (err) {
    postList.innerHTML = <li>Error loading posts: ${err.message}</li>;
  }
}

// ===========================
// Display User Info on Dashboard
// ===========================
const welcomeName = document.getElementById("welcomeName");

onAuthStateChanged(auth, async (user) => {
  if (user && welcomeName) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const fullName = userDoc.data().fullName;
      welcomeName.textContent = `Welcome, ${fullName}!`;
    } else {
      welcomeName.textContent = "Welcome!";
    }
  }

  // Optional: redirect if not logged in
  if (!user && window.location.pathname.includes("dashboard.html")) {
    window.location.href = "index.html";
  }
});


  // --- PROTECT DASHBOARD & GREET USER ---
  if (window.location.pathname.endsWith("dashboard.html")) {
    onAuthStateChanged(auth, async user => {
      if (!user) return window.location.href = "login.html";

      // fetch user profile
      const docSnap = await getDoc(doc(db, "users", user.uid));
      const name    = docSnap.exists() ? docSnap.data().fullName : "Pilot";
      document.getElementById("welcomeMsg").textContent = `Welcome, ${name}!`;
    });
  }
}
// ===========================
// Schedule Post Handler
// ===========================
const scheduleBtn = document.getElementById("scheduleBtn");

if (scheduleBtn) {
  scheduleBtn.addEventListener("click", async () => {
    const content = document.getElementById("postContent").value.trim();
    const date = document.getElementById("postDate").value;

    if (!content || !date) {
      alert("Please enter both post content and date.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("User not logged in.");
      return;
    }

    try {
      const postRef = doc(db, "users", user.uid, "posts", Date.now().toString());
      await setDoc(postRef, {
        content: content,
        date: date,
        createdAt: new Date().toISOString()
      });
      alert("Post scheduled successfully!");
      document.getElementById("postContent").value = "";
      document.getElementById("postDate").value = "";
    } catch (err) {
      alert("Error scheduling post: " + err.message);
    }
  });
}
// ===========================
// Fake AI Advice Generator
// ===========================
const adviceBtn = document.getElementById("generateAdviceBtn");
const adviceBox = document.getElementById("adviceBox");

if (adviceBtn && adviceBox) {
  const fakeTips = [
    "Post early in the morning for better engagement.",
    "Use trending hashtags to boost reach.",
    "Add a call-to-action to your captions.",
    "Reel videos perform 2x better than photos.",
    "Use high contrast colors in your graphics.",
  ];

  adviceBtn.addEventListener("click", () => {
    const random = fakeTips[Math.floor(Math.random() * fakeTips.length)];
    adviceBox.textContent = random;
  });
} 