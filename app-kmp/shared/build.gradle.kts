import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.android.kmp.library)
    alias(libs.plugins.compose.multiplatform)
    alias(libs.plugins.kotlin.compose)
}

kotlin {
    android {
        namespace = "ovh.gabrielhuav.salones.shared"
        compileSdk = libs.versions.android.compileSdk.get().toInt()
        minSdk = libs.versions.android.minSdk.get().toInt()

        // Pruebas que corren en la JVM de la computadora (sin emulador).
        // Tarea de Gradle: :shared:testAndroidHostTest
        withHostTestBuilder {}

        compilerOptions {
            jvmTarget.set(JvmTarget.JVM_11)
        }
    }

    // Solo Apple Silicon: `iosX64` (simulador en Mac Intel) ya no lo publica Compose 1.11.
    listOf(
        iosArm64(),          // iPhone real
        iosSimulatorArm64(), // simulador en Mac con Apple Silicon
    ).forEach { target ->
        target.binaries.framework {
            // En Swift se importa como `import Shared`.
            baseName = "Shared"
            isStatic = true
        }
    }

    sourceSets {
        commonMain.dependencies {
            implementation(libs.compose.runtime)
            implementation(libs.compose.foundation)
            implementation(libs.compose.ui)
            implementation(libs.compose.material3)
        }
        // Pruebas de la lógica compartida (Ubicacion.kt): las mismas para Android e iOS.
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
    }
}
