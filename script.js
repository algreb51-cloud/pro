// ملف سكربت رئيسي يعمل كموديول (ES module)
// هنا نهيّئ Firebase ونضيف أنيميشن الواجهة

// 1) استيراد Firebase من CDN (لا تحتاج npm في مشروع HTML عادي)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2) إعدادات مشروعك على Firebase (سيتم استخدامها لاحقاً للتخزين/القاعدة السحابية)
const firebaseConfig = {
  apiKey: "AIzaSyD3_s6lmv3_7E8Qs-v_sSFG1rSTcVjXI8E",
  authDomain: "algrebpro.firebaseapp.com",
  projectId: "algrebpro",
  storageBucket: "algrebpro.firebasestorage.app",
  messagingSenderId: "479357280586",
  appId: "1:479357280586:web:6de1f33a408f4df8cca1b3",
  measurementId: "G-T5DZYVCB8D"
};

// 3) تهيئة Firebase مرة واحدة في المشروع
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// 4) عناصر الصفحة القابلة للتحرير
const editableMap = {
  brandLabel: '[data-edit-key="brandLabel"]',
  tagMain: '[data-edit-key="tagMain"]',
  tagSecondary: '[data-edit-key="tagSecondary"]',
  mainTitle: '[data-edit-key="mainTitle"]',
  subtitle: '[data-edit-key="subtitle"] span',
  years: '[data-edit-key="years"]',
  contactLabel: '[data-edit-key="contactLabel"]',
  phone: '[data-edit-key="phone"]',
  email: '[data-edit-key="email"]',
  nameplate: '[data-edit-key="nameplate"]',
  profileLabel: '[data-edit-key="profileLabel"]',
  card1Badge: '[data-edit-key="card1Badge"]',
  card1Title: '[data-edit-key="card1Title"]',
  card1Details: '[data-edit-key="card1Details"]',
  card1Tools: '[data-edit-key="card1Tools"]',
  card2Badge: '[data-edit-key="card2Badge"]',
  card2Title: '[data-edit-key="card2Title"]',
  card2Details: '[data-edit-key="card2Details"]',
  card2Tools: '[data-edit-key="card2Tools"]',
  card3Badge: '[data-edit-key="card3Badge"]',
  card3Title: '[data-edit-key="card3Title"]',
  card3Details: '[data-edit-key="card3Details"]',
  card3Tools: '[data-edit-key="card3Tools"]',
  card4Badge: '[data-edit-key="card4Badge"]',
  card4Title: '[data-edit-key="card4Title"]',
  card4Details: '[data-edit-key="card4Details"]',
  card4Tools: '[data-edit-key="card4Tools"]',
  card5Badge: '[data-edit-key="card5Badge"]',
  card5Title: '[data-edit-key="card5Title"]',
  card5Details: '[data-edit-key="card5Details"]',
  card5Tools: '[data-edit-key="card5Tools"]',
};

const imageFieldKey = "cardImage";
const pageDocRef = doc(db, "pages", "home");

let isEditMode = false;
let currentEditableElement = null;
let toolbarSizeSlider = null;
let toolbarColorInput = null;
let toolbarAlignButtons = [];
let globalEditClickHandlerAttached = false;

function rgbToHex(color) {
  if (!color) return "#ffffff";
  const match = color.match(/\d+/g);
  if (!match) return "#ffffff";
  const [r, g, b] = match.map(Number);
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function updateToolbarForElement(el) {
  if (!el) return;
  const computed = window.getComputedStyle(el);

  if (toolbarSizeSlider) {
    const fontSizePx = parseFloat(computed.fontSize);
    if (!Number.isNaN(fontSizePx)) {
      const min = parseFloat(toolbarSizeSlider.min) || 12;
      const max = parseFloat(toolbarSizeSlider.max) || 72;
      const clamped = Math.max(min, Math.min(max, fontSizePx));
      toolbarSizeSlider.value = clamped;
    }
  }

  if (toolbarColorInput) {
    toolbarColorInput.value = rgbToHex(computed.color);
  }

  if (toolbarAlignButtons && toolbarAlignButtons.length) {
    const currentAlign = computed.textAlign;
    toolbarAlignButtons.forEach((btn) => {
      const align = btn.getAttribute("data-align");
      btn.classList.toggle(
        "edit-toolbar__icon-button--active",
        align === currentAlign
      );
    });
  }
}

function handleGlobalEditClick(event) {
  if (!isEditMode) return;
  const el = event.target.closest('[contenteditable="true"]');
  if (!el) return;
  currentEditableElement = el;
  updateToolbarForElement(el);
}

function setupExperienceCarousel() {
  const cards = Array.from(document.querySelectorAll(".experience-card"));
  if (!cards.length) return;

  const total = cards.length;
  let currentIndex = 2; // اجعل بطاقة الفضاء في المنتصف كبداية

  function applyPositions() {
    cards.forEach((card, index) => {
      card.classList.remove(
        "experience-card--far-left",
        "experience-card--left",
        "experience-card--center",
        "experience-card--right",
        "experience-card--far-right",
        "experience-card--visible",
        "experience-card--hidden"
      );

      const diff = (index - currentIndex + total) % total;
      let positionClass = "";

      if (diff === 0) {
        positionClass = "experience-card--center";
      } else if (diff === 1) {
        positionClass = "experience-card--right";
      } else if (diff === 2) {
        positionClass = "experience-card--far-right";
      } else if (diff === total - 1) {
        positionClass = "experience-card--left";
      } else if (diff === total - 2) {
        positionClass = "experience-card--far-left";
      }

      if (!positionClass) {
        card.classList.add("experience-card--hidden");
      } else {
        card.classList.add(positionClass, "experience-card--visible");
      }
    });
  }

  function goNext() {
    currentIndex = (currentIndex + 1) % total;
    applyPositions();
  }

  function goPrev() {
    currentIndex = (currentIndex - 1 + total) % total;
    applyPositions();
  }

  // بدء الترتيب والظهور الأول
  requestAnimationFrame(() => {
    setTimeout(() => {
      applyPositions();
    }, 80);
  });

  const prevBtn = document.querySelector('[data-experience-nav="prev"]');
  const nextBtn = document.querySelector('[data-experience-nav="next"]');

  if (prevBtn) {
    prevBtn.addEventListener("click", goPrev);
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", goNext);
  }

  // دعم السحب باللمس على الجوال
  const touchArea = document.querySelector(".experience-strip__inner");
  if (touchArea) {
    let startX = 0;
    let startY = 0;
    let moved = false;

    touchArea.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        moved = false;
      },
      { passive: true }
    );

    touchArea.addEventListener(
      "touchmove",
      () => {
        moved = true;
      },
      { passive: true }
    );

    touchArea.addEventListener(
      "touchend",
      (event) => {
        if (!moved) return;

        const touch = event.changedTouches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) {
            goNext();
          } else {
            goPrev();
          }
        }
      },
      { passive: true }
    );
  }
}

function getEditableElements() {
  const result = {};
  for (const [key, selector] of Object.entries(editableMap)) {
    const el = document.querySelector(selector);
    if (el) result[key] = el;
  }
  return result;
}

function setEditingEnabled(enabled) {
  isEditMode = enabled;

  const elements = getEditableElements();
  Object.values(elements).forEach((el) => {
    el.contentEditable = enabled ? "true" : "false";

    // عند التعديل على أي نص يتم الجدولة للحفظ التلقائي
    if (enabled) {
      el.addEventListener("input", scheduleAutoSave);
    } else {
      el.removeEventListener("input", scheduleAutoSave);
    }
  });

  if (enabled && !globalEditClickHandlerAttached) {
    document.addEventListener("click", handleGlobalEditClick);
    globalEditClickHandlerAttached = true;
  } else if (!enabled && globalEditClickHandlerAttached) {
    document.removeEventListener("click", handleGlobalEditClick);
    globalEditClickHandlerAttached = false;
    currentEditableElement = null;
  }

  const charactersCard = document.querySelector('[data-edit-key="cardImage"]');
  if (charactersCard) {
    charactersCard.style.cursor = enabled ? "pointer" : "default";
    charactersCard.classList.toggle("characters--editing", enabled);
  }

  const experienceCards = document.querySelectorAll(".experience-card");
  experienceCards.forEach((card) => {
    card.classList.toggle("experience-card--editing", enabled);
  });

  const hint = document.querySelector(".editable-hint");
  const toolbar = document.querySelector(".edit-toolbar");
  if (hint && toolbar) {
    hint.classList.toggle("editable-hint--visible", enabled);
    toolbar.classList.toggle("edit-toolbar--visible", enabled);
  }
  
  // تفعيل/تعطيل تعديل المزادات
  toggleAuctionEditMode(enabled);
}

async function loadPageContent() {
  try {
    const snapshot = await getDoc(pageDocRef);
    if (!snapshot.exists()) return;

    const data = snapshot.data();
    const elements = getEditableElements();

    for (const [key, el] of Object.entries(elements)) {
      if (typeof data[key] === "string") {
        el.textContent = data[key];
      }
      const styleKey = `${key}Style`;
      if (typeof data[styleKey] === "string") {
        el.style.cssText = data[styleKey];
      }
    }

    // تحميل صور بطاقات الخبرة
    const expImages = document.querySelectorAll(".experience-card__image");
    expImages.forEach((img, index) => {
      const key = `card${index + 1}Image`;
      if (data[key]) {
        img.style.backgroundImage = `url("${data[key]}")`;
        img.dataset.imageUrl = data[key];
      }
    });

    if (data[imageFieldKey]) {
      const charactersCard = document.querySelector(
        '[data-edit-key="cardImage"]'
      );
      if (charactersCard) {
        charactersCard.style.backgroundImage = `url("${data[imageFieldKey]}")`;
        charactersCard.style.backgroundSize = "cover";
        charactersCard.style.backgroundPosition = "center";
      }
    }

    // تحميل بطاقات المزاد
    if (data.auctions && Array.isArray(data.auctions)) {
      renderAuctionGrid(data.auctions);
    }
  } catch (error) {
    console.error("Error loading content:", error);
    // إظهار رسالة بسيطة لمساعدتك على اكتشاف المشكلة لو كانت من إعدادات Firestore
    alert(
      "تعذر تحميل المحتوى من السحابة.\nتأكد أن Cloud Firestore مفعّل في مشروع Firebase.\n" +
        (error.code ? `تفاصيل الخطأ: ${error.code}` : "")
    );
  }
}

let autoSaveTimeout = null;

function scheduleAutoSave() {
  if (!auth.currentUser) return; // لا نحفظ إلا لو المستخدم مسجّل دخول
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
  autoSaveTimeout = setTimeout(() => {
    savePageContent(false);
  }, 1200); // يحفظ بعد 1.2 ثانية من آخر تعديل
}

async function savePageContent(showAlert = true) {
  const elements = getEditableElements();
  const payload = {};

  for (const [key, el] of Object.entries(elements)) {
    payload[key] = el.textContent.trim();
    const styleText = el.getAttribute("style");
    if (styleText && styleText.trim()) {
      payload[`${key}Style`] = styleText;
    }
  }

  // حفظ صور بطاقات الخبرة
  const expImages = document.querySelectorAll(".experience-card__image");
  expImages.forEach((img, index) => {
    if (img.dataset.imageUrl) {
      payload[`card${index + 1}Image`] = img.dataset.imageUrl;
    }
  });

  const charactersCard = document.querySelector('[data-edit-key="cardImage"]');
  if (charactersCard && charactersCard.dataset.imageUrl) {
    payload[imageFieldKey] = charactersCard.dataset.imageUrl;
  }

  // حفظ بطاقات المزاد
  payload.auctions = scrapeAuctionData();

  try {
    await setDoc(pageDocRef, payload, { merge: true });
    if (showAlert) {
      alert("تم حفظ المحتوى في السحابة ✅");
    }
  } catch (error) {
    console.error("Error saving content:", error);
    if (showAlert) {
      let message = "حدث خطأ أثناء الحفظ في السحابة.";
      if (error.code === "failed-precondition") {
        message +=
          "\nيبدو أن Cloud Firestore غير مفعّل لمشروعك أو لم يتم إنشاء قاعدة البيانات.";
      } else if (error.code === "permission-denied") {
        message +=
          "\nقواعد الحماية (Security Rules) في Firestore تمنع الكتابة. جرّب وضع القواعد في وضع الاختبار (Test mode) مؤقتاً.";
      }
      message += error.code ? `\nتفاصيل الخطأ: ${error.code}` : "";
      alert(message);
    }
  }
}

function setupImageEditor() {
  const charactersCard = document.querySelector('[data-edit-key="cardImage"]');
  if (!charactersCard) return;

  const button = charactersCard.querySelector(".image-edit-button");
  if (!button) return;

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!isEditMode) return;
    const url = window.prompt("ضع رابط صورة لبطاقة الكرت (URL):");
    if (!url) return;
    charactersCard.style.backgroundImage = `url("${url}")`;
    charactersCard.style.backgroundSize = "cover";
    charactersCard.style.backgroundPosition = "center";
    charactersCard.dataset.imageUrl = url;
    scheduleAutoSave();
  });
}

function setupExperienceCardImages() {
  const images = document.querySelectorAll(".experience-card__image");
  images.forEach((img) => {
    img.style.position = "relative";

    if (img.querySelector(".image-edit-button")) return;

    const btn = document.createElement("div");
    btn.className = "image-edit-button";
    img.appendChild(btn);

    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!isEditMode) return;
      const url = window.prompt("ضع رابط صورة للبطاقة (URL):");
      if (!url) return;
      img.style.backgroundImage = `url("${url}")`;
      img.dataset.imageUrl = url;
      scheduleAutoSave();
    });
  });
}

// --- منطق بطاقات المزاد (Auctions) ---

function setupAuctionSystem() {
  const addBtn = document.getElementById('add-auction-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addNewAuctionCard();
    });
  }

  // تهيئة البطاقات الموجودة مسبقاً في HTML
  const cards = document.querySelectorAll('.auction-card');
  cards.forEach(card => setupSingleAuctionCard(card));
}

function setupSingleAuctionCard(card) {
  // 1. إضافة زر الحذف
  if (!card.querySelector('.auction-card__delete')) {
    const delBtn = document.createElement('div');
    delBtn.className = 'auction-card__delete';
    delBtn.textContent = '×';
    delBtn.title = 'Delete Card';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Delete this auction card?')) {
        card.remove();
        scheduleAutoSave();
      }
    });
    card.appendChild(delBtn);
  }

  // 2. إضافة زر تعديل الصورة
  const mediaDiv = card.querySelector('.auction-card__media');
  const imgDiv = card.querySelector('.auction-card__image');
  if (mediaDiv && imgDiv && !mediaDiv.querySelector('.image-edit-button')) {
    const editBtn = document.createElement('div');
    editBtn.className = 'image-edit-button';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentUrl = imgDiv.dataset.imageUrl || '';
      const url = prompt('Enter image URL for auction item:', currentUrl);
      if (url) {
        imgDiv.style.backgroundImage = `url("${url}")`;
        imgDiv.dataset.imageUrl = url;
        scheduleAutoSave();
      }
    });
    mediaDiv.appendChild(editBtn);
  }

  // 3. إضافة زر "إضافة صورة إضافية" (+)
  if (mediaDiv && imgDiv && !mediaDiv.querySelector('.add-image-button')) {
    const addImgBtn = document.createElement('div');
    addImgBtn.className = 'add-image-button';
    addImgBtn.textContent = '+';
    addImgBtn.title = 'Add another image';
    addImgBtn.addEventListener('click', (e) => handleAddImage(e, imgDiv));
    mediaDiv.appendChild(addImgBtn);
  }

  // 4. مراقبة التعديلات النصية للحفظ التلقائي
  const editables = card.querySelectorAll('.auction-card__title, .time-badge, .auction-card__meta, .auction-card__price strong');
  editables.forEach(el => {
    el.addEventListener('input', scheduleAutoSave);
  });

  // 5. فتح النافذة المنبثقة عند النقر (عرض التفاصيل)
  card.addEventListener('click', (e) => {
    // لا تفتح النافذة إذا كنا في وضع التعديل أو ضغطنا على أزرار التحكم
    // السماح بفتح النافذة في وضع التعديل لإدارة الصور، بشرط عدم النقر على نص قابل للتعديل
    if (isEditMode && e.target.isContentEditable) return;
    if (e.target.closest('.auction-card__delete') || e.target.closest('.image-edit-button') || e.target.closest('.add-image-button') || e.target.closest('.fave')) return;

    openProjectModal(card);
  });
}

function handleAddImage(e, imgDiv) {
  e.stopPropagation();
  const url = prompt('Enter URL for additional image:');
  if (url) {
    // جلب الصور الحالية
    let images = [];
    try {
      images = JSON.parse(imgDiv.dataset.images || '[]');
    } catch (err) {
      // Fallback if only single image existed
      if (imgDiv.dataset.imageUrl) images.push(imgDiv.dataset.imageUrl);
    }
    
    // إذا كانت القائمة فارغة وكان هناك صورة خلفية، نعتبرها الصورة الأولى
    if (images.length === 0 && imgDiv.dataset.imageUrl) {
      images.push(imgDiv.dataset.imageUrl);
    }

    images.push(url);
    imgDiv.dataset.images = JSON.stringify(images);
    
    // تحديث الصورة الرئيسية إذا كانت هذه أول صورة
    if (images.length === 1) {
      imgDiv.style.backgroundImage = `url("${url}")`;
      imgDiv.dataset.imageUrl = url;
    }
    
    alert(`Image added! Total images: ${images.length}`);
    scheduleAutoSave();
  }
}

function addNewAuctionCard() {
  const grid = document.getElementById('auction-grid');
  const card = document.createElement('article');
  card.className = 'auction-card';
  // قالب البطاقة الجديدة
  card.innerHTML = `
    <div class="auction-card__media">
      <span class="time-badge">12:00:00</span>
      <button class="fave" aria-label="favorite">♡</button>
      <div class="auction-card__image" style="background-image: url('https://placehold.co/400x300/262641/FFF?text=New+Item');" data-image-url="https://placehold.co/400x300/262641/FFF?text=New+Item"></div>
    </div>
    <div class="auction-card__body">
      <div class="auction-card__avatars">
        <span class="avatar"></span>
      </div>
      <h3 class="auction-card__title">New Item</h3>
      <p class="auction-card__meta">Bid 0.1 ETH</p>
      <div class="auction-card__price">Price <strong>0.05 ETH</strong></div>
    </div>
  `;
  grid.appendChild(card);
  setupSingleAuctionCard(card);
  
  // تفعيل وضع التعديل للبطاقة الجديدة فوراً إذا كان الوضع نشطاً
  if (isEditMode) {
    toggleAuctionEditMode(true);
  }
  scheduleAutoSave();
}

function toggleAuctionEditMode(enabled) {
  const addBtn = document.getElementById('add-auction-btn');
  if (addBtn) addBtn.classList.toggle('auction-add-btn--visible', enabled);

  const cards = document.querySelectorAll('.auction-card');
  cards.forEach(card => {
    card.classList.toggle('auction-card--editing', enabled);
    const editables = card.querySelectorAll('.auction-card__title, .time-badge, .auction-card__meta, .auction-card__price strong');
    editables.forEach(el => el.contentEditable = enabled ? "true" : "false");
  });
}

function scrapeAuctionData() {
  const cards = document.querySelectorAll('.auction-card');
  return Array.from(cards).map(card => {
    const imgDiv = card.querySelector('.auction-card__image');
    
    // محاولة جلب مصفوفة الصور
    let images = [];
    if (imgDiv?.dataset.images) {
      try { images = JSON.parse(imgDiv.dataset.images); } catch(e){}
    }
    // إذا لم توجد مصفوفة، نستخدم الصورة الفردية
    if (images.length === 0 && imgDiv?.dataset.imageUrl) {
      images.push(imgDiv.dataset.imageUrl);
    }

    return {
      time: card.querySelector('.time-badge')?.textContent || '',
      title: card.querySelector('.auction-card__title')?.textContent || '',
      meta: card.querySelector('.auction-card__meta')?.textContent || '',
      price: card.querySelector('.auction-card__price strong')?.textContent || '',
      imageStyle: imgDiv?.style.backgroundImage || '',
      imageUrl: imgDiv?.dataset.imageUrl || '', // Legacy support
      images: images // New array support
    };
  });
}

function renderAuctionGrid(auctions) {
  const grid = document.getElementById('auction-grid');
  if (!grid) return;
  grid.innerHTML = ''; // مسح البطاقات الافتراضية

  auctions.forEach(item => {
    const card = document.createElement('article');
    card.className = 'auction-card';
    
    // استعادة الخلفية (سواء كانت صورة أو تدرج لوني)
    let bgStyle = item.imageStyle;
    let mainImage = item.imageUrl;
    let imagesList = item.images || [];

    // إذا كانت هناك قائمة صور، نأخذ الأولى كخلفية
    if (imagesList.length > 0) {
      mainImage = imagesList[0];
      bgStyle = `url("${mainImage}")`;
    } else if (mainImage) {
      // دعم البيانات القديمة
      imagesList = [mainImage];
      bgStyle = `url("${mainImage}")`;
    }

    // تحويل القائمة لنص للتخزين في الـ DOM
    const imagesAttr = JSON.stringify(imagesList);

    card.innerHTML = `
      <div class="auction-card__media">
        <span class="time-badge">${item.time}</span>
        <button class="fave" aria-label="favorite">♡</button>
        <div class="auction-card__image" style='background-image: ${bgStyle}' data-image-url="${mainImage || ''}" data-images='${imagesAttr}'></div>
      </div>
      <div class="auction-card__body">
        <div class="auction-card__avatars">
          <span class="avatar"></span>
        </div>
        <h3 class="auction-card__title">${item.title}</h3>
        <p class="auction-card__meta">${item.meta}</h3>
        <div class="auction-card__price">Price <strong>${item.price}</strong></div>
      </div>
    `;
    grid.appendChild(card);
    setupSingleAuctionCard(card);
  });

  if (isEditMode) {
    toggleAuctionEditMode(true);
  }
}

// --- Project Modal Logic ---
function setupProjectModal() {
  const modal = document.getElementById('project-modal');
  const closeBtn = document.getElementById('project-modal-close');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('project-modal--visible');
    });
    
    // إغلاق عند النقر خارج الصورة
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('project-modal--visible');
      }
    });
  }
}

function openProjectModal(card) {
  const modal = document.getElementById('project-modal');
  const imagesContainer = document.getElementById('project-modal-images');
  const titleEl = document.getElementById('project-modal-title');
  const metaEl = document.getElementById('project-modal-meta');
  const priceEl = document.getElementById('project-modal-price');

  const imgDiv = card.querySelector('.auction-card__image');
  const title = card.querySelector('.auction-card__title').textContent;
  const meta = card.querySelector('.auction-card__meta').textContent;
  const price = card.querySelector('.auction-card__price').innerHTML; // innerHTML to keep styling
  
  // جلب الصور
  let images = [];
  try {
    images = JSON.parse(imgDiv.dataset.images || '[]');
  } catch (e) {}
  
  // Fallback
  if (images.length === 0 && imgDiv.dataset.imageUrl) {
    images.push(imgDiv.dataset.imageUrl);
  }

  // بناء عناصر الصور
  imagesContainer.innerHTML = '';
  images.forEach(src => {
    // تغليف الصورة في حاوية لإضافة زر الحذف
    const wrapper = document.createElement('div');
    wrapper.className = 'modal-image-wrapper';

    const img = document.createElement('img');
    img.src = src;
    img.className = 'project-modal__image';
    img.alt = title;
    wrapper.appendChild(img);

    // إضافة زر الحذف إذا كان وضع التعديل مفعلاً
    if (isEditMode) {
      const delBtn = document.createElement('button');
      delBtn.className = 'modal-image-delete';
      delBtn.innerHTML = '&times;';
      delBtn.title = 'Remove this image';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to remove this image?')) {
          deleteImageFromCard(card, src);
        }
      };
      wrapper.appendChild(delBtn);
    }

    imagesContainer.appendChild(wrapper);
  });

  titleEl.textContent = title;
  metaEl.textContent = meta;
  priceEl.innerHTML = price;

  modal.classList.add('project-modal--visible');
}

function deleteImageFromCard(card, srcToDelete) {
  const imgDiv = card.querySelector('.auction-card__image');
  let images = [];
  try {
    images = JSON.parse(imgDiv.dataset.images || '[]');
  } catch (e) {}

  // Fallback
  if (images.length === 0 && imgDiv.dataset.imageUrl) {
    images.push(imgDiv.dataset.imageUrl);
  }

  // تصفية الصور لإزالة الصورة المحددة
  const newImages = images.filter(src => src !== srcToDelete);

  // تحديث البيانات
  imgDiv.dataset.images = JSON.stringify(newImages);

  // تحديث الصورة الرئيسية (الخلفية)
  if (newImages.length > 0) {
    imgDiv.style.backgroundImage = `url("${newImages[0]}")`;
    imgDiv.dataset.imageUrl = newImages[0];
  } else {
    imgDiv.style.backgroundImage = 'none'; // أو صورة افتراضية
    imgDiv.dataset.imageUrl = '';
  }

  scheduleAutoSave();
  
  // إعادة رسم النافذة المنبثقة لتحديث القائمة
  openProjectModal(card);
}

// 6) إضافة تأثيرات عند التمرير (Scroll)
function setupScrollEffects() {
  const hero = document.querySelector(".hero");
  const experienceStrip = document.querySelector(".experience-strip");

  if (!hero || !experienceStrip) return;

  window.addEventListener(
    "scroll",
    () => {
      const experienceRect = experienceStrip.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // حساب مقدار دخول قسم البطاقات إلى الشاشة من الأسفل
      const scrollAmount = viewportHeight - experienceRect.top;

      if (scrollAmount > 0) {
        // إذا كان القسم ظاهرًا، نطبق التأثير الضبابي
        const blurFactor = Math.min(1, scrollAmount / (viewportHeight * 0.5)); // الوصول للضباب الكامل عند 50% من الشاشة
        const blurValue = blurFactor * 20; // أقصى قيمة للضباب 8px
        hero.style.filter = `blur(${blurValue}px)`;
      } else {
        hero.style.filter = "blur(0px)";
      }
    },
    { passive: true }
  );
}
// 5) تسجيل الدخول السحابي باستخدام البريد/كلمة المرور (Email & Password)
function setupAuth() {
  const loginBtn = document.getElementById("login-btn");
  const toolbar = document.createElement("div");
  toolbar.className = "edit-toolbar";
  toolbar.innerHTML = `
    <span class="edit-toolbar__status">EDIT MODE</span>
    <div class="edit-toolbar__controls">
      <label class="edit-toolbar__label">
        Size
        <input
          type="range"
          min="12"
          max="72"
          value="32"
          class="edit-toolbar__slider"
          data-style-control="fontSize"
        />
      </label>
      <label class="edit-toolbar__label">
        Color
        <input
          type="color"
          value="#ffffff"
          class="edit-toolbar__color"
          data-style-control="color"
        />
      </label>
      <div class="edit-toolbar__align" aria-label="Text alignment">
        <button
          type="button"
          class="edit-toolbar__icon-button"
          data-align="left"
        >
          L
        </button>
        <button
          type="button"
          class="edit-toolbar__icon-button"
          data-align="center"
        >
          C
        </button>
        <button
          type="button"
          class="edit-toolbar__icon-button"
          data-align="right"
        >
          R
        </button>
      </div>
    </div>
    <button class="edit-toolbar__button edit-toolbar__button--secondary" data-action="save">
      SAVE CLOUD
    </button>
  `;
  document.body.appendChild(toolbar);

  const hint = document.createElement("div");
  hint.className = "editable-hint";
  hint.textContent = "يمكنك تعديل النصوص مباشرة ثم الضغط على SAVE CLOUD";
  document.body.appendChild(hint);

  const saveButton = toolbar.querySelector('[data-action="save"]');
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      savePageContent();
    });
  }

  const sizeSlider = toolbar.querySelector('[data-style-control="fontSize"]');
  const colorInput = toolbar.querySelector('[data-style-control="color"]');
  const alignButtons = toolbar.querySelectorAll("[data-align]");

  toolbarSizeSlider = sizeSlider;
  toolbarColorInput = colorInput;
  toolbarAlignButtons = Array.from(alignButtons);

  if (sizeSlider) {
    sizeSlider.addEventListener("input", () => {
      if (!currentEditableElement) return;
      currentEditableElement.style.fontSize = `${sizeSlider.value}px`;
      scheduleAutoSave();
    });
  }

  if (colorInput) {
    colorInput.addEventListener("input", () => {
      if (!currentEditableElement) return;
      currentEditableElement.style.color = colorInput.value;
      scheduleAutoSave();
    });
  }

  alignButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!currentEditableElement) return;
      const align = btn.getAttribute("data-align") || "left";
      currentEditableElement.style.textAlign = align;
      toolbarAlignButtons.forEach((b) =>
        b.classList.toggle(
          "edit-toolbar__icon-button--active",
          b === btn
        )
      );
      scheduleAutoSave();
    });
  });

  // عناصر نافذة تسجيل الدخول
  const modal = document.getElementById("login-modal");
  const overlay = document.getElementById("login-overlay");
  const closeBtn = modal?.querySelector(".login-modal__close");
  const authForm = document.getElementById("auth-form");
  const toggleModeBtn = document.getElementById("toggle-auth-mode");
  const errorBox = document.getElementById("auth-error");
  const submitBtn = authForm?.querySelector(".login-modal__submit");
  const titleEl = modal?.querySelector(".login-modal__title");

  function setAuthMode(mode) {
    if (!authForm || !titleEl || !submitBtn || !toggleModeBtn) return;
    authForm.dataset.mode = mode;
    if (mode === "signup") {
      titleEl.textContent = "إنشاء حساب جديد";
      submitBtn.textContent = "إنشاء حساب";
      toggleModeBtn.textContent = "لديك حساب؟ تسجيل الدخول";
    } else {
      titleEl.textContent = "تسجيل الدخول";
      submitBtn.textContent = "تسجيل الدخول";
      toggleModeBtn.textContent = "حساب جديد؟ إنشاء حساب";
    }
    if (errorBox) errorBox.textContent = "";
  }

  function openAuthModal(mode = "login") {
    if (!modal || !overlay) return;
    setAuthMode(mode);
    modal.classList.add("login-modal--visible");
    overlay.classList.add("login-overlay--visible");
    const emailInput = document.getElementById("auth-email");
    if (emailInput) {
      setTimeout(() => emailInput.focus(), 50);
    }
  }

  function closeAuthModal() {
    if (!modal || !overlay) return;
    modal.classList.remove("login-modal--visible");
    overlay.classList.remove("login-overlay--visible");
  }

  if (toggleModeBtn) {
    toggleModeBtn.addEventListener("click", () => {
      const currentMode = authForm?.dataset.mode === "signup" ? "signup" : "login";
      setAuthMode(currentMode === "signup" ? "login" : "signup");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeAuthModal();
    });
  }

  if (overlay) {
    overlay.addEventListener("click", () => {
      closeAuthModal();
    });
  }

  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!submitBtn) return;

      const emailInput = document.getElementById("auth-email");
      const passwordInput = document.getElementById("auth-password");
      if (!emailInput || !passwordInput) return;

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      if (!email || !password) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "جارٍ...";
      if (errorBox) errorBox.textContent = "";

      try {
        if (authForm.dataset.mode === "signup") {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
        closeAuthModal();
      } catch (error) {
        console.error("Auth error:", error);
        let message = "تعذر إتمام العملية، تأكد من البيانات وحاول مرة أخرى";
        if (error.code === "auth/user-not-found") {
          message = "لا يوجد حساب بهذا البريد، جرّب إنشاء حساب جديد";
        } else if (error.code === "auth/wrong-password") {
          message = "كلمة المرور غير صحيحة";
        } else if (error.code === "auth/email-already-in-use") {
          message = "هذا البريد مستخدم بالفعل، سجّل الدخول بدلاً من ذلك";
        } else if (error.code === "auth/weak-password") {
          message = "كلمة المرور ضعيفة، اختر كلمة مرور أقوى (6 أحرف على الأقل)";
        }
        if (errorBox) errorBox.textContent = message;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent =
          authForm.dataset.mode === "signup" ? "إنشاء حساب" : "تسجيل الدخول";
      }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await signOut(auth);
      } else {
        openAuthModal("login");
      }
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (!loginBtn) return;

    const label = loginBtn.querySelector(".cloud-button__label");
    if (user) {
      if (label) label.textContent = "Logout";
      setEditingEnabled(true);
      await loadPageContent();
    } else {
      if (label) label.textContent = "Login";
      setEditingEnabled(false);
    }
  });
}

// 7) تحريك الشخصيات عند التحميل والهوفر + تهيئة كل شيء
document.addEventListener("DOMContentLoaded", () => {
  // قراءة المحتوى من السحابة للجميع (حتى لو المستخدم غير مسجّل دخول)
  loadPageContent();

  setupAuth();
  setupImageEditor();
  setupExperienceCardImages();
  setupScrollEffects();
  setupAuctionSystem(); // تهيئة نظام المزادات
  setupProjectModal(); // تهيئة النافذة المنبثقة

  // تفعيل أنيميشن دخول الصفحة
  setTimeout(() => {
    document.body.classList.add("page-loaded");
  }, 50);

  const characters = document.querySelectorAll(".character");

  // دخول ناعم عند أول تحميل
  characters.forEach((char, index) => {
    char.style.transform = "translateY(40px) scale(0.9)";
    char.style.opacity = "0";

    requestAnimationFrame(() => {
      setTimeout(() => {
        char.style.transition =
          "transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease";
        char.style.transform = "translateY(0) scale(1)";
        char.style.opacity = "1";
      }, 140 * index);
    });
  });

  // إهتزاز خفيف عند الهوفر
  const charactersWrapper = document.querySelector(".characters");
  if (charactersWrapper) {
    charactersWrapper.addEventListener("mouseenter", () => {
      characters.forEach((char, i) => {
        char.style.transition =
          "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)";
        char.style.transform = `translateY(-6px) rotate(${i === 1 ? 0 : i === 0 ? -3 : 3
          }deg)`;
      });
    });

    charactersWrapper.addEventListener("mouseleave", () => {
      characters.forEach((char) => {
        char.style.transform = "translateY(0) rotate(0deg)";
      });
    });
  }

  // تهيئة شريط بطاقات التجربة كعارض (Carousel)
  setupExperienceCarousel();
});
