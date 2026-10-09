package com.styro.launcher

import android.app.role.RoleManager
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.AdaptiveIconDrawable
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.io.ByteArrayOutputStream

class StyroLauncherModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "StyroLauncher"

  private fun drawableToBase64(drawable: Drawable): String? {
    return try {
      val bitmap = when (drawable) {
        is BitmapDrawable -> drawable.bitmap
        is AdaptiveIconDrawable -> {
          val b = Bitmap.createBitmap(192, 192, Bitmap.Config.ARGB_8888)
          val canvas = Canvas(b)
          drawable.setBounds(0, 0, 192, 192)
          drawable.draw(canvas)
          b
        }
        else -> {
          val w = drawable.intrinsicWidth.takeIf { it > 0 } ?: 192
          val h = drawable.intrinsicHeight.takeIf { it > 0 } ?: 192
          val b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
          val canvas = Canvas(b)
          drawable.setBounds(0, 0, w, h)
          drawable.draw(canvas)
          b
        }
      }
      val scaled = Bitmap.createScaledBitmap(bitmap, 96, 96, true)
      val out = ByteArrayOutputStream()
      scaled.compress(Bitmap.CompressFormat.PNG, 100, out)
      Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    } catch (e: Exception) {
      null
    }
  }

  @ReactMethod
  fun getInstalledApps(promise: Promise) {
    try {
      val pm = reactApplicationContext.packageManager
      val intent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      val resolveInfos = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        pm.queryIntentActivities(intent, PackageManager.ResolveInfoFlags.of(0))
      } else {
        @Suppress("DEPRECATION")
        pm.queryIntentActivities(intent, 0)
      }
      val result: WritableArray = Arguments.createArray()
      for (ri in resolveInfos) {
        val map: WritableMap = Arguments.createMap()
        map.putString("packageName", ri.activityInfo.packageName)
        map.putString("label", ri.loadLabel(pm).toString())
        val icon = drawableToBase64(ri.loadIcon(pm))
        if (icon != null) map.putString("iconBase64", icon)
        result.pushMap(map)
      }
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("GET_APPS_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun launchApp(packageName: String, promise: Promise) {
    try {
      val pm = reactApplicationContext.packageManager
      val intent = pm.getLaunchIntentForPackage(packageName)
        ?: throw IllegalArgumentException("No launch intent for $packageName")
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("LAUNCH_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun openAppInfo(packageName: String, promise: Promise) {
    try {
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.parse("package:$packageName")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactApplicationContext.startActivity(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("OPEN_INFO_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun requestUninstall(packageName: String, promise: Promise) {
    try {
      val intent = Intent(Intent.ACTION_DELETE).apply {
        data = Uri.parse("package:$packageName")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      reactApplicationContext.startActivity(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("UNINSTALL_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun isDefaultLauncher(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        promise.resolve(false)
        return
      }
      val rm = reactApplicationContext.getSystemService(RoleManager::class.java)
      promise.resolve(rm?.isRoleHeld(RoleManager.ROLE_HOME) == true)
    } catch (e: Exception) {
      promise.reject("ROLE_CHECK_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun requestDefaultLauncher(promise: Promise) {
    try {
      val activity = currentActivity ?: throw IllegalStateException("No foreground activity")
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val rm = activity.getSystemService(RoleManager::class.java)
        if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME) &&
          !rm.isRoleHeld(RoleManager.ROLE_HOME)
        ) {
          activity.startActivity(rm.createRequestRoleIntent(RoleManager.ROLE_HOME))
          promise.resolve(null)
          return
        }
      }
      val intent = Intent(Settings.ACTION_HOME_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      activity.startActivity(intent)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("ROLE_REQUEST_FAILED", e.message, e)
    }
  }
}
