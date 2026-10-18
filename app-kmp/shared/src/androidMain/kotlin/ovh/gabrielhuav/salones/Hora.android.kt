package ovh.gabrielhuav.salones

import java.util.Calendar

// Calendar y no java.time: java.time pide Android 8 (API 26) y la app llega a Android 7 (API 24).
actual fun horaLocal(): Int = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
