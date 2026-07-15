const NOTIFICATION_SOUNDS: Record<string, string> = {
  SERVICE_REQUEST: "/notifications/sound-1.mp3",
  REST: "/notifications/sound-2.mp3",
};

const audioBySrc = new Map<string, HTMLAudioElement>();
let audioUnlocked = false;

function getAudio(src: string) {
  let audio = audioBySrc.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = "auto";
    audioBySrc.set(src, audio);
  }
  return audio;
}

function unlockAudio() {
  if (audioUnlocked || typeof window === "undefined") return;
  audioUnlocked = true;

  Object.values(NOTIFICATION_SOUNDS).forEach((src) => {
    const audio = getAudio(src);
    audio.muted = true;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        audio.muted = false;
      });
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
}

export function playNotificationSound(type?: string) {
  if (typeof window === "undefined") return;

  const sound = type ? NOTIFICATION_SOUNDS[type] : undefined;
  if (!sound) return;

  const audio = getAudio(sound);
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}
