import Flutter
import UIKit
import UserNotifications
import AVFoundation

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate, UNUserNotificationCenterDelegate {
  private var audioPlayer: AVAudioPlayer?
  private let channelName = "com.laasyaacademy.app/alarm"

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    UNUserNotificationCenter.current().delegate = self
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)

    let controller = window?.rootViewController as? FlutterViewController
    let binaryMessenger = controller?.binaryMessenger ?? (engineBridge as? FlutterEngine)?.binaryMessenger

    if let messenger = binaryMessenger {
      setupMethodChannel(messenger: messenger)
    }
  }

  private func setupMethodChannel(messenger: FlutterBinaryMessenger) {
    let channel = FlutterMethodChannel(name: channelName, binaryMessenger: messenger)
    channel.setMethodCallHandler { [weak self] (call, result) in
      guard let self = self else { return }
      switch call.method {
      case "startAlarmRing":
        let args = call.arguments as? [String: Any]
        let title = args?["title"] as? String ?? "CLASS COMPLETED!"
        let message = args?["message"] as? String ?? "Class session has concluded. Please come and pick up your child."
        self.playClassCompletedSound()
        self.scheduleClassCompletedNotification(title: title, message: message)
        result(true)

      case "playClassCompletedSound":
        self.playClassCompletedSound()
        result(true)

      case "stopAlarmRing":
        self.stopAudio()
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ["laasya_class_completed"])
        result(true)

      case "showAttendanceNotification":
        let args = call.arguments as? [String: Any]
        let title = args?["title"] as? String ?? "Attendance Confirmed"
        let message = args?["message"] as? String ?? "Attendance marked by Guru"
        self.scheduleAttendanceNotification(title: title, message: message)
        result(true)

      case "requestNotificationPermission", "requestAllPermissions":
        self.requestNotificationPermission()
        result(true)

      case "isIgnoringBatteryOptimizations", "requestBatteryOptimization":
        result(true)

      case "startBackgroundAlertService", "stopBackgroundAlertService", "saveStudentAlertConfig", "scheduleBackgroundAlertCheck":
        result(true)

      case "markAlertProcessed":
        if let args = call.arguments as? [String: Any], let alertId = args["alert_id"] as? String {
          UserDefaults.standard.set(true, forKey: "laasya_processed_\(alertId)")
        }
        result(true)

      case "isAlertProcessed":
        if let args = call.arguments as? [String: Any], let alertId = args["alert_id"] as? String {
          let processed = UserDefaults.standard.bool(forKey: "laasya_processed_\(alertId)")
          result(processed)
        } else {
          result(false)
        }

      case "getPendingNotificationRoute":
        result(nil)

      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  private func requestNotificationPermission() {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
      if let error = error {
        print("Notification permission error: \(error.localizedDescription)")
      }
    }
  }

  private func playClassCompletedSound() {
    stopAudio()
    guard let url = Bundle.main.url(forResource: "class_completed", withExtension: "mp3") else {
      print("Could not find class_completed.mp3 in bundle")
      return
    }
    do {
      try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.duckOthers])
      try AVAudioSession.sharedInstance().setActive(true)
      audioPlayer = try AVAudioPlayer(contentsOf: url)
      audioPlayer?.numberOfLoops = 0
      audioPlayer?.prepareToPlay()
      audioPlayer?.play()
    } catch {
      print("Error playing class_completed audio: \(error.localizedDescription)")
    }
  }

  private func stopAudio() {
    audioPlayer?.stop()
    audioPlayer = nil
  }

  private func scheduleClassCompletedNotification(title: String, message: String) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = message
    content.sound = UNNotificationSound(named: UNNotificationSoundName("class_completed.mp3"))
    content.userInfo = ["route": "/attendance"]

    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.1, repeats: false)
    let request = UNNotificationRequest(identifier: "laasya_class_completed", content: content, trigger: trigger)
    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        print("Error scheduling notification: \(error.localizedDescription)")
      }
    }
  }

  private func scheduleAttendanceNotification(title: String, message: String) {
    let content = UNMutableNotificationContent()
    content.title = title
    content.body = message
    content.sound = UNNotificationSound.default
    content.userInfo = ["route": "/attendance"]

    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 0.1, repeats: false)
    let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
    UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
  }

  // Allow notification sound and banner when app is in foreground
  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    completionHandler([.banner, .sound, .badge, .list])
  }
}
