// 공유 시트(카카오톡 / 링크 복사) — 먹이 요청(owner)·결과 자랑(result) 공용
// 바텀시트를 띄우고, 카카오 공유 또는 클립보드 복사를 처리한다.
//
// 사용 예:
//   openShareSheet({
//     sheetTitle: "결과 공유하기",
//     url: "https://.../#/share/abc123",
//     kakao: { title, description, imageUrl, buttonTitle },
//     onCopied: () => { ... },   // 복사 성공 시(생략하면 기본 알림)
//   });

const KAKAO_KEY = "f716efd9dc8b2eac6addddad097c4b4f";

export function openShareSheet({ sheetTitle = "공유하기", url, kakao, onCopied }) {
  const backdrop = document.createElement("div");
  backdrop.className = "sheet-backdrop";
  backdrop.innerHTML = `
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-title">${sheetTitle}</div>
      <button class="sheet-btn kakao" id="sheet-kakao">카카오톡으로 공유하기</button>
      <button class="sheet-btn copy" id="sheet-copy">링크 복사하기</button>
      <button class="sheet-cancel" id="sheet-cancel">취소</button>
    </div>
  `;

  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector("#sheet-cancel").onclick = close;

  backdrop.querySelector("#sheet-kakao").onclick = () => {
    close();
    // 카카오 SDK 미로드/미설정 시에도 깨지지 않도록 복사로 폴백
    if (!window.Kakao || !kakao) {
      copyLink();
      return;
    }
    try {
      if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_KEY);
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: kakao.title,
          description: kakao.description,
          imageUrl: kakao.imageUrl,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: kakao.buttonTitle || "보러 가기", link: { mobileWebUrl: url, webUrl: url } }],
      });
    } catch {
      copyLink();
    }
  };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      if (onCopied) onCopied();
      else alert("링크를 복사했어요! 친구에게 붙여넣어 공유해보세요 :)");
    } catch {
      prompt("이 링크를 복사해서 공유해주세요", url);
    }
  }

  backdrop.querySelector("#sheet-copy").onclick = () => {
    close();
    copyLink();
  };
}
