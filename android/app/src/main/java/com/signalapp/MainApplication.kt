package com.signalapp

import android.app.Application
import android.content.Context
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry
import com.signalapp.frameprocessors.HandLandmarkerFrameProcessorPlugin

class MainApplication : Application(), ReactApplication {

  companion object {
    // Held so the frame processor plugin (which VisionCamera instantiates
    // without a Context) can load the bundled MediaPipe .task model from
    // assets. Set in onCreate, before any camera frame can be processed.
    var appContext: Context? = null
      private set
  }

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    appContext = applicationContext
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }

    FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectHandLandmarks") { proxy, options ->
      HandLandmarkerFrameProcessorPlugin(proxy, options)
    }
  }
}
