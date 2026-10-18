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
        versionCode = 4
        versionName = "0.4.0"
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

// El diseño de cada campus vive en ../campus (Azcapotzalco), ../campus-cuajimalpa y ../campus-iztapalapa, y lo
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
            val nombre = if (f.extension == "glb") "modelo.glb" else f.name
            f.copyTo(raiz.resolve("$carpeta/$nombre").also { it.parentFile.mkdirs() })
        }
    }
}

val copiarCampus = tasks.register<CopiarCampus>("copiarCampus") {
    listOf(
        "campus" to "UAM_Azcapotzalco.glb",
        "campus-cuajimalpa" to "UAM_Cuajimalpa.glb",
        "campus-iztapalapa" to "UAM_Iztapalapa.glb",
    ).forEach { (carpeta, glb) ->
        archivos.from(listOf(glb, "plano_2d.png", "georreferencia.json").map { rootProject.file("../$carpeta/$it") })
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
    implementation(libs.play.services.location)
}
