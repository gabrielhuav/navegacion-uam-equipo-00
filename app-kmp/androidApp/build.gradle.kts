import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    // AGP 9 trae Kotlin integrado: NO se aplica `org.jetbrains.kotlin.android`.
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "ovh.gabrielhuav.salones"
    compileSdk = libs.versions.android.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "ovh.gabrielhuav.salones"
        minSdk = libs.versions.android.minSdk.get().toInt()
        targetSdk = libs.versions.android.targetSdk.get().toInt()
        versionCode = 3
        versionName = "0.3.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    buildFeatures {
        compose = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_11)
    }
}

// El diseño del campus vive en ../campus y lo edita el visor web. Al compilar, Gradle copia a la app
// solo lo que usa (modelo 3D, plano 2D y su georreferencia): la web y el celular comparten los mismos archivos.
abstract class CopiarCampus : DefaultTask() {
    @get:InputFiles
    abstract val archivos: ConfigurableFileCollection

    @get:OutputDirectory
    abstract val destino: DirectoryProperty

    @TaskAction
    fun copiar() {
        val carpeta = destino.get().asFile.resolve("campus")
        carpeta.deleteRecursively()
        carpeta.mkdirs()
        archivos.forEach { it.copyTo(carpeta.resolve(it.name)) }
    }
}

val copiarCampus = tasks.register<CopiarCampus>("copiarCampus") {
    archivos.from(listOf("UAM_Azcapotzalco.glb", "plano_2d.png", "georreferencia.json").map { rootProject.file("../campus/$it") })
}

androidComponents {
    onVariants { variante ->
        variante.sources.assets?.addGeneratedSourceDirectory(copiarCampus, CopiarCampus::destino)
    }
}

dependencies {
    implementation(project(":shared"))
    implementation(libs.androidx.activity.compose)
    implementation(libs.play.services.location)
}
