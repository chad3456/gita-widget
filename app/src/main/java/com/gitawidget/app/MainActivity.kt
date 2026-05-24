package com.gitawidget.app

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val verse = GitaVerses.verseForToday()

        findViewById<TextView>(R.id.main_header).text =
            getString(R.string.verse_header, verse.chapter, verse.verse)
        findViewById<TextView>(R.id.main_sanskrit).text = verse.sanskrit
        findViewById<TextView>(R.id.main_english).text = verse.english
        findViewById<TextView>(R.id.main_hindi).text = verse.hindi

        findViewById<Button>(R.id.main_translate_btn).setOnClickListener {
            val i = Intent(this, TranslateActivity::class.java).apply {
                putExtra(TranslateActivity.EXTRA_CHAPTER, verse.chapter)
                putExtra(TranslateActivity.EXTRA_VERSE, verse.verse)
            }
            startActivity(i)
        }
    }
}
