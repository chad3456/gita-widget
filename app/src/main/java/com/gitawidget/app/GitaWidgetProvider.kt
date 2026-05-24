package com.gitawidget.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class GitaWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { id -> updateWidget(context, appWidgetManager, id) }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(ComponentName(context, GitaWidgetProvider::class.java))
            ids.forEach { id -> updateWidget(context, mgr, id) }
        }
    }

    companion object {
        const val ACTION_REFRESH = "com.gitawidget.app.ACTION_REFRESH"

        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val verse = GitaVerses.verseForToday()
            val views = RemoteViews(context.packageName, R.layout.widget_gita)

            views.setTextViewText(
                R.id.widget_title,
                context.getString(R.string.verse_header, verse.chapter, verse.verse)
            )
            views.setTextViewText(R.id.widget_sanskrit, verse.sanskrit)
            views.setTextViewText(R.id.widget_english, verse.english)
            views.setTextViewText(R.id.widget_hindi, verse.hindi)

            // Translate button → opens TranslateActivity with this verse
            val translateIntent = Intent(context, TranslateActivity::class.java).apply {
                putExtra(TranslateActivity.EXTRA_CHAPTER, verse.chapter)
                putExtra(TranslateActivity.EXTRA_VERSE, verse.verse)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            }
            val translatePending = PendingIntent.getActivity(
                context,
                appWidgetId,
                translateIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_translate_btn, translatePending)

            // Tapping the verse body opens the main activity (full reading view)
            val openIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            }
            val openPending = PendingIntent.getActivity(
                context,
                appWidgetId + 1000,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, openPending)

            // Refresh icon
            val refreshIntent = Intent(context, GitaWidgetProvider::class.java).apply {
                action = ACTION_REFRESH
            }
            val refreshPending = PendingIntent.getBroadcast(
                context,
                appWidgetId + 2000,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_refresh_btn, refreshPending)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
