plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.salones_uam"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.salones_uam"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

// El diseño de cada campus vive en ../campus (Azcapotzalco) y ../campus-<unidad> (las otras cuatro), y lo
// edita su visor web. Antes de compilar, Gradle copia a assets/campus/<carpeta>/ sólo lo que usa la app (el GLB
// como modelo.glb); esas copias no se versionan. Así web, KMP y Flutter comparten los mismos archivos.
val copiarCampus by tasks.registering(Copy::class) {
    listOf(
        "campus" to "azcapotzalco",
        "campus-cuajimalpa" to "cuajimalpa",
        "campus-iztapalapa" to "iztapalapa",
        "campus-lerma" to "lerma",
        "campus-xochimilco" to "xochimilco",
    ).forEach { (origen, carpeta) ->
            from(rootProject.file("../../$origen")) {
                // Con y sin marca de agua: la segunda la usa el modo desarrollador.
                include("UAM_*.glb", "plano_2d.png", "plano_2d_sin_marca.png", "georreferencia.json")
                rename("UAM_.*_sin_marca\\.glb", "modelo_sin_marca.glb")
                rename("UAM_[^_]*\\.glb", "modelo.glb")
                into(carpeta)
            }
        }
    into(rootProject.file("../assets/campus"))
}
tasks.named("preBuild") { dependsOn(copiarCampus) }
tasks.matching { it.name.startsWith("compileFlutterBuild") }.configureEach { dependsOn(copiarCampus) }
