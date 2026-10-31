import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.Properties

plugins {
    // AGP 9 trae Kotlin integrado: NO se aplica `org.jetbrains.kotlin.android`.
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

// Configuración local: las contraseñas y la llave nunca se versionan.
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.isFile) {
        keystorePropertiesFile.inputStream().use { load(it) }
    }
}

android {
    namespace = "ovh.gabrielhuav.salones"
    compileSdk = libs.versions.android.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "ovh.gabrielhuav.salones"
        minSdk = libs.versions.android.minSdk.get().toInt()
        targetSdk = libs.versions.android.targetSdk.get().toInt()
        versionCode = 9
        versionName = "0.4.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    buildFeatures {
        compose = true
    }

    if (keystorePropertiesFile.isFile) {
        signingConfigs {
            create("release") {
                fun required(name: String): String =
                    keystoreProperties.getProperty(name)?.takeIf { it.isNotBlank() }
                        ?: error("Falta $name en keystore.properties")
                storeFile = file(required("storeFile"))
                storePassword = required("storePassword")
                keyAlias = required("keyAlias")
                keyPassword = required("keyPassword")
            }
        }
        buildTypes.getByName("release") {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_11)
    }
}

// El diseño de cada campus vive en ../campus (Azcapotzalco) y ../campus-<unidad> (las otras cuatro), y lo
// edita su visor web. Al compilar, Gradle copia a la app sólo lo que usa (modelo 3D, plano 2D y georreferencia),
// cada unidad en campus/<carpeta>/ y el GLB como modelo.glb: la web y el celular comparten los mismos archivos.
abstract class CopiarCampus : DefaultTask() {
    @get:InputFiles
    abstract val archivos: ConfigurableFileCollection

    @get:OutputDirectory
    abstract val destino: DirectoryProperty

    @TaskAction
    fun copiar() {
        val raiz = destino.get().asFile.resolve("campus")
        raiz.deleteRecursively()
        archivos.forEach { f ->
            val carpeta = f.parentFile.name.removePrefix("campus-").let { if (it == "campus") "azcapotzalco" else it }
            val nombre = when {
                f.name.endsWith("_sin_marca.glb") -> "modelo_sin_marca.glb"
                f.extension == "glb" -> "modelo.glb"
                else -> f.name
            }
            f.copyTo(raiz.resolve("$carpeta/$nombre").also { it.parentFile.mkdirs() })
        }
    }
}

val copiarCampus = tasks.register<CopiarCampus>("copiarCampus") {
    listOf(
        "campus" to "UAM_Azcapotzalco.glb",
        "campus-cuajimalpa" to "UAM_Cuajimalpa.glb",
        "campus-iztapalapa" to "UAM_Iztapalapa.glb",
        "campus-lerma" to "UAM_Lerma.glb",
        "campus-xochimilco" to "UAM_Xochimilco.glb",
        "campus-escom" to "ESCOM_IPN.glb", // IPN, campus aparte
    ).forEach { (carpeta, glb) ->
        // Con y sin marca de agua: la segunda la usa el modo desarrollador.
        val sinMarca = glb.removeSuffix(".glb") + "_sin_marca.glb"
        archivos.from(
            listOf(glb, sinMarca, "plano_2d.png", "plano_2d_sin_marca.png", "georreferencia.json", "rutas.json")
                .map { rootProject.file("../$carpeta/$it") }
                .filter { it.exists() }, // rutas.json: por ahora sólo Azcapotzalco y ESCOM
        )
    }
}

androidComponents {
    onVariants { variante ->
        variante.sources.assets?.addGeneratedSourceDirectory(copiarCampus, CopiarCampus::destino)
    }
}

dependencies {
    implementation(project(":shared"))
    implementation(libs.androidx.activity.compose)
    // Location trae Fragment 1.1.0 de forma transitiva; Activity Result requiere >= 1.3.0.
    implementation("androidx.fragment:fragment:1.8.9")
    implementation(libs.play.services.location)
    // Prototipo 4 · experimento: cámara (CameraX) y modelo de reconocimiento (LiteRT, antes TFLite).
    implementation(libs.compose.foundation)
    implementation(libs.compose.material3)
    implementation(libs.camera.camera2)
    implementation(libs.camera.lifecycle)
    implementation(libs.camera.view)
    implementation(libs.litert)
}
