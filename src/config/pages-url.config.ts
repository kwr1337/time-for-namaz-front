class ADMIN {
	private root = '/admin'

	HOME = this.root
	DASHBOARD = `${this.root}/dashboard`
	CITY = `${this.root}/dashboard/cities`
	MOSQUE = `${this.root}/dashboard/mosque`
	PRAYER = `${this.root}/dashboard/prayer`
	QRCODE = `${this.root}/dashboard/qrcode`
	ADMINMANAGMENT  = `${this.root}/dashboard/adminManagement`
	MEDIA = `${this.root}/dashboard/media`
	AUDIT_LOGS = `${this.root}/dashboard/audit-logs`
	DICTIONARY = `${this.root}/dashboard/dictionary`
	LANGUAGE_SETTINGS = `${this.root}/dashboard/language-settings`
	NAMES_OF_ALLAH = `${this.root}/dashboard/names-of-allah`

}

export const DASHBOARD_PAGES = new ADMIN()
