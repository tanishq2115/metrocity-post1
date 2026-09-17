/* लोकमदत — Article Share Buttons
   Add this script AFTER the existing news.html article script.
   It automatically replaces the old single copy-link control with:
   1) Share to Apps
   2) Share to WhatsApp
   3) Copy Link
   4) आणखी बातम्या
*/
(function () {
  "use strict";

  const SHARE_CSS = `
    .article-share{
      display:grid !important;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:9px !important;
      margin:27px auto 0 !important;
      max-width:790px;
      padding-top:19px;
      border-top:1px solid #eee;
    }
    .article-share button,
    .article-share a{
      box-sizing:border-box;
      border:1px solid #d9dbde;
      border-radius:7px;
      padding:10px 13px;
      min-height:42px;
      font-size:12px;
      font-weight:800;
      background:#fff;
      cursor:pointer;
      font-family:inherit;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:6px;
      text-decoration:none;
      color:inherit;
      text-align:center;
    }
    .article-share button:hover,
    .article-share a:hover{
      border-color:#c8001d;
      color:#c8001d;
    }
    .article-share .share-primary{
      border-color:#c8001d;
      color:#c8001d;
    }
    .article-share .share-whatsapp{
      border-color:#27a844;
      color:#198b39;
    }
    .article-share .share-whatsapp:hover{
      border-color:#198b39;
      color:#198b39;
    }
    @media(max-width:650px){
      .article-share{
        grid-template-columns:1fr !important;
        gap:8px !important;
        margin-top:21px !important;
      }
      .article-share button,
      .article-share a{
        width:100%;
      }
    }
  `;

  const style = document.createElement("style");
  style.id = "lokmadat-share-ui-style";
  style.textContent = SHARE_CSS;
  document.head.appendChild(style);

  function articleUrl() {
    const url = new URL(window.location.href);
    url.hash = "";
    return url.href;
  }

  function legacyCopy(value) {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);

    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }

    ta.remove();
    return ok;
  }

  async function copyShareLink(url, button) {
    let ok = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        ok = true;
      }
    } catch (e) {}

    if (!ok) ok = legacyCopy(url);

    const oldText = button.textContent;

    if (ok) {
      button.textContent = "✓ लिंक कॉपी झाली";
      setTimeout(() => {
        button.textContent = oldText;
      }, 1800);
    } else {
      button.textContent = "कॉपी झाली नाही";
      setTimeout(() => {
        button.textContent = oldText;
      }, 1800);

      window.prompt("लिंक कॉपी करण्यासाठी खालील लिंक निवडा:", url);
    }
  }

  function shareToApps(url, title) {
    if (navigator.share) {
      navigator.share({
        title: title || "लोकमदत",
        text: title || "लोकमदत बातमी",
        url: url
      }).catch(function () {});
      return;
    }

    window.prompt(
      "तुमच्या ब्राउझरमध्ये Share to Apps उपलब्ध नाही. ही लिंक कॉपी करा:",
      url
    );
  }

  function shareToWhatsApp(url, title) {
    const text = (title ? title + "\n\n" : "") + url;
    const waUrl = "https://wa.me/?text=" + encodeURIComponent(text);

    window.open(
      waUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function buildShareButtons() {
    const share = document.querySelector(".article-share");
    if (!share || share.dataset.lokmadatShareReady === "1") return;

    share.dataset.lokmadatShareReady = "1";

    const url = articleUrl();

    const heading =
      document.querySelector(".normal-article h1")?.textContent?.trim() ||
      document.title.replace(/\s*\|\s*लोकमदत\s*$/u, "").trim() ||
      "लोकमदत";

    share.innerHTML = "";

    const apps = document.createElement("button");
    apps.type = "button";
    apps.className = "share-primary";
    apps.textContent = "📤 Share to Apps";
    apps.addEventListener("click", function () {
      shareToApps(url, heading);
    });

    const whatsapp = document.createElement("button");
    whatsapp.type = "button";
    whatsapp.className = "share-whatsapp";
    whatsapp.textContent = "🟢 Share to WhatsApp";
    whatsapp.addEventListener("click", function () {
      shareToWhatsApp(url, heading);
    });

    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "🔗 Copy Link";
    copy.addEventListener("click", function () {
      copyShareLink(url, copy);
    });

    const more = document.createElement("a");
    more.href = "index.html";
    more.textContent = "← आणखी बातम्या";

    share.appendChild(apps);
    share.appendChild(whatsapp);
    share.appendChild(copy);
    share.appendChild(more);
  }

  // The article is rendered asynchronously, so watch for the share area.
  const observer = new MutationObserver(function () {
    buildShareButtons();
  });

  function start() {
    buildShareButtons();

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // Expose functions in case they are useful elsewhere.
  window.lokmadatShareToApps = shareToApps;
  window.lokmadatShareToWhatsApp = shareToWhatsApp;
  window.lokmadatCopyShareLink = copyShareLink;
})();
