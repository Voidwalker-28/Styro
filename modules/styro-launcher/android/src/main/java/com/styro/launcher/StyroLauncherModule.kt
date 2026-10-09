package com.styro.launcher

import android.app.role.RoleManager
import android.content.Context
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
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class StyroLauncherModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context not available")

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

  override fun definition() = ModuleDefinition {
    Name("StyroLauncher")

    Function("getInstalledApps") {
      val pm = context.packageManager
      val intent = Intent(Intent.ACTION_MAIN).apply {
        addCategory(Intent.CATEGORY_LAUNCHER)
      }
      val resolveInfos = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        pm.queryIntentActivities(intent, PackageManager.ResolveInfoFlags.of(0))
      } else {
        @Suppress("DEPRECATION")
        pm.queryIntentActivities(intent, 0)
      }
      resolveInfos.map { ri ->
        val pkg = ri.activityInfo.packageName
        mapOf(
          "packageName" to pkg,
          "label" to ri.loadLabel(pm).toString(),
          "iconBase64" to drawableToBase64(ri.loadIcon(pm))
        )
      }
    }

    Function("launchApp") { packageName: String ->
      val pm = context.packageManager
      val intent = pm.getLaunchIntentForPackage(packageName)
        ?: throw IllegalArgumentException("No launch intent for $packageName")
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }

    Function("openAppInfo") { packageName: String ->
      val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.parse("package:$packageName")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    Function("requestUninstall") { packageName: String ->
      val intent = Intent(Intent.ACTION_DELETE).apply {
        data = Uri.parse("package:$packageName")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    Function("isDefaultLauncher") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return@Function false
      val rm = context.getSystemService(RoleManager::class.java) ?: return@Function false
      rm.isRoleHeld(RoleManager.ROLE_HOME)
    }

    Function("requestDefaultLauncher") {
      val activity = appContext.currentActivity
        ?: throw IllegalStateException("No foreground activity")
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val rm = activity.getSystemService(RoleManager::class.java)
        if (rm != null && rm.isRoleAvailable(RoleManager.ROLE_HOME) &&
          !rm.isRoleHeld(RoleManager.ROLE_HOME)
        ) {
          activity.startActivity(rm.createRequestRoleIntent(RoleManager.ROLE_HOME))
          return@Function
        }
      }
      // Fallback for older Android or when the role isn't available:
      // open the system home-app picker.
      val intent = Intent(Settings.ACTION_HOME_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      activity.startActivity(intent)
    }
  }
}
