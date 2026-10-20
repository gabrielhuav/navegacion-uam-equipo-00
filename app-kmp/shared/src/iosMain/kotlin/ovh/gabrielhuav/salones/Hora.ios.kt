package ovh.gabrielhuav.salones

import platform.Foundation.NSCalendar
import platform.Foundation.NSCalendarUnitHour
import platform.Foundation.NSDate

actual fun horaLocal(): Int = NSCalendar.currentCalendar.component(NSCalendarUnitHour, NSDate()).toInt()
