/**
 * Device integration layer — Capacitor when nativo, fallback web.
 * Pede permissões do dispositivo e expõe câmara, ficheiros, partilha, rede, etc.
 */

export type PermissionKey =
  | "camera"
  | "photos"
  | "notifications"
  | "storage"
  | "network";

export type PermissionState = "granted" | "denied" | "prompt" | "unavailable";

export type DevicePermissionMap = Record<PermissionKey, PermissionState>;

const PERM_STORAGE_KEY = "makina_device_perms_v1";

function isNative(): boolean {
  try {
    const Cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
      .Capacitor;
    return !!Cap?.isNativePlatform?.();
  } catch {
    return false;
  }
}

export function getSavedPermissionPrompted(): boolean {
  try {
    return localStorage.getItem(PERM_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPermissionPrompted() {
  try {
    localStorage.setItem(PERM_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export async function getDeviceInfo(): Promise<{
  platform: string;
  model?: string;
  osVersion?: string;
  isVirtual?: boolean;
  name?: string;
}> {
  if (isNative()) {
    try {
      const { Device } = await import("@capacitor/device");
      const info = await Device.getInfo();
      const id = await Device.getId().catch(() => ({ identifier: "" }));
      return {
        platform: info.platform,
        model: info.model,
        osVersion: info.osVersion,
        isVirtual: info.isVirtual,
        name: info.name || id.identifier,
      };
    } catch {
      /* fallthrough */
    }
  }
  return {
    platform: navigator.userAgent.includes("Android")
      ? "android"
      : navigator.userAgent.includes("iPhone")
        ? "ios"
        : "web",
    model: navigator.userAgent.slice(0, 48),
  };
}

export async function getNetworkStatus(): Promise<{
  connected: boolean;
  connectionType: string;
}> {
  if (isNative()) {
    try {
      const { Network } = await import("@capacitor/network");
      const s = await Network.getStatus();
      return {
        connected: s.connected,
        connectionType: s.connectionType,
      };
    } catch {
      /* fallthrough */
    }
  }
  return {
    connected: navigator.onLine,
    connectionType: navigator.onLine ? "unknown" : "none",
  };
}

export async function checkPermissions(): Promise<DevicePermissionMap> {
  const result: DevicePermissionMap = {
    camera: "prompt",
    photos: "prompt",
    notifications: "prompt",
    storage: "prompt",
    network: "granted",
  };

  if (isNative()) {
    try {
      const { Camera } = await import("@capacitor/camera");
      const cam = await Camera.checkPermissions();
      result.camera = (cam.camera as PermissionState) || "prompt";
      result.photos = (cam.photos as PermissionState) || "prompt";
    } catch {
      result.camera = "unavailable";
      result.photos = "unavailable";
    }
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const n = await LocalNotifications.checkPermissions();
      result.notifications = (n.display as PermissionState) || "prompt";
    } catch {
      result.notifications = "unavailable";
    }
    // Filesystem / storage — treated as granted after user export/import on Android 13+
    result.storage = "prompt";
  } else {
    // Web: Notification API
    if ("Notification" in window) {
      result.notifications =
        Notification.permission === "granted"
          ? "granted"
          : Notification.permission === "denied"
            ? "denied"
            : "prompt";
    } else {
      result.notifications = "unavailable";
    }
    result.camera = "prompt";
    result.photos = "prompt";
    result.storage = "granted";
  }

  const net = await getNetworkStatus();
  result.network = net.connected ? "granted" : "denied";
  return result;
}

export async function requestAllPermissions(): Promise<DevicePermissionMap> {
  const result = await checkPermissions();

  if (isNative()) {
    try {
      const { Camera } = await import("@capacitor/camera");
      const cam = await Camera.requestPermissions({
        permissions: ["camera", "photos"],
      });
      result.camera = (cam.camera as PermissionState) || result.camera;
      result.photos = (cam.photos as PermissionState) || result.photos;
    } catch {
      /* ignore */
    }
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const n = await LocalNotifications.requestPermissions();
      result.notifications = (n.display as PermissionState) || result.notifications;
    } catch {
      /* ignore */
    }
    // Storage: probe by writing a tiny file
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      await Filesystem.writeFile({
        path: "makina/.perm_probe",
        data: btoa("ok"),
        directory: Directory.Data,
        recursive: true,
      });
      result.storage = "granted";
    } catch {
      result.storage = "denied";
    }
  } else {
    if ("Notification" in window && Notification.permission === "default") {
      const p = await Notification.requestPermission();
      result.notifications = p === "granted" ? "granted" : p === "denied" ? "denied" : "prompt";
    }
    // Camera permission is requested on first getUserMedia / file capture
    result.camera = "prompt";
    result.photos = "granted";
    result.storage = "granted";
  }

  markPermissionPrompted();
  return result;
}

/** Take photo with device camera (native) or file input fallback handled by caller */
export async function takePhoto(): Promise<string | null> {
  if (isNative()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import(
        "@capacitor/camera"
      );
      const photo = await Camera.getPhoto({
        quality: 75,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 1024,
        correctOrientation: true,
      });
      return photo.dataUrl || null;
    } catch {
      return null;
    }
  }
  return null; // web uses <input capture>
}

export async function pickPhoto(): Promise<string | null> {
  if (isNative()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import(
        "@capacitor/camera"
      );
      const photo = await Camera.getPhoto({
        quality: 75,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 1024,
        correctOrientation: true,
      });
      return photo.dataUrl || null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function shareText(title: string, text: string, url?: string) {
  if (isNative()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text, url, dialogTitle: title });
      return true;
    } catch {
      /* fallthrough */
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function shareFileJson(filename: string, json: unknown) {
  const content = JSON.stringify(json, null, 2);
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const path = `makina/backups/${filename}`;
      await Filesystem.writeFile({
        path,
        data: btoa(unescape(encodeURIComponent(content))),
        directory: Directory.Cache,
        recursive: true,
      });
      const uri = await Filesystem.getUri({
        path,
        directory: Directory.Cache,
      });
      await Share.share({
        title: "Backup MAKINA",
        text: filename,
        url: uri.uri,
        dialogTitle: "Partilhar backup",
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
  // web download
  const blob = new Blob([content], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  return true;
}

export async function saveBackupToDevice(filename: string, json: unknown) {
  const content = JSON.stringify(json, null, 2);
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      await Filesystem.writeFile({
        path: `MAKINA/${filename}`,
        data: btoa(unescape(encodeURIComponent(content))),
        directory: Directory.Documents,
        recursive: true,
      });
      return { ok: true as const, path: `Documents/MAKINA/${filename}` };
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : "Falha ao gravar",
      };
    }
  }
  const blob = new Blob([content], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  return { ok: true as const, path: filename };
}

export async function notifyLocal(title: string, body: string) {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") {
        await LocalNotifications.requestPermissions();
      }
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 100000,
            title,
            body,
            schedule: { at: new Date(Date.now() + 500) },
          },
        ],
      });
      return true;
    } catch {
      return false;
    }
  }
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
    return true;
  }
  return false;
}

export async function hapticSuccess() {
  if (isNative()) {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Medium });
      return;
    } catch {
      /* ignore */
    }
  }
  if (navigator.vibrate) navigator.vibrate(30);
}

export async function hapticError() {
  if (isNative()) {
    try {
      const { Haptics, NotificationType } = await import("@capacitor/haptics");
      await Haptics.notification({ type: NotificationType.Error });
      return;
    } catch {
      /* ignore */
    }
  }
  if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
}

export async function hideKeyboard() {
  if (isNative()) {
    try {
      const { Keyboard } = await import("@capacitor/keyboard");
      await Keyboard.hide();
    } catch {
      /* ignore */
    }
  }
}

export { isNative };
