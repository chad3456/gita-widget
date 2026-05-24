package com.gitawidget.app

import android.os.Bundle
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.ProgressBar
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions

class TranslateActivity : AppCompatActivity() {

    private lateinit var verse: GitaVerse
    private var translator: Translator? = null

    private lateinit var sanskritTv: TextView
    private lateinit var englishTv: TextView
    private lateinit var translatedTv: TextView
    private lateinit var languageSpinner: Spinner
    private lateinit var progress: ProgressBar
    private lateinit var headerTv: TextView

    // (Display name, ML Kit language code). Default = Hindi.
    private val languages: List<Pair<String, String>> = listOf(
        "Hindi (हिन्दी)" to TranslateLanguage.HINDI,
        "Bengali (বাংলা)" to TranslateLanguage.BENGALI,
        "Gujarati (ગુજરાતી)" to TranslateLanguage.GUJARATI,
        "Kannada (ಕನ್ನಡ)" to TranslateLanguage.KANNADA,
        "Marathi (मराठी)" to TranslateLanguage.MARATHI,
        "Tamil (தமிழ்)" to TranslateLanguage.TAMIL,
        "Telugu (తెలుగు)" to TranslateLanguage.TELUGU,
        "Urdu (اردو)" to TranslateLanguage.URDU,
        "Spanish (Español)" to TranslateLanguage.SPANISH,
        "French (Français)" to TranslateLanguage.FRENCH,
        "German (Deutsch)" to TranslateLanguage.GERMAN,
        "Russian (Русский)" to TranslateLanguage.RUSSIAN,
        "Japanese (日本語)" to TranslateLanguage.JAPANESE,
        "Chinese (中文)" to TranslateLanguage.CHINESE,
        "Arabic (العربية)" to TranslateLanguage.ARABIC,
        "Portuguese (Português)" to TranslateLanguage.PORTUGUESE,
        "Italian (Italiano)" to TranslateLanguage.ITALIAN,
        "Indonesian (Bahasa)" to TranslateLanguage.INDONESIAN,
        "Korean (한국어)" to TranslateLanguage.KOREAN,
        "Dutch (Nederlands)" to TranslateLanguage.DUTCH
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_translate)

        val chapter = intent.getIntExtra(EXTRA_CHAPTER, -1)
        val verseNum = intent.getIntExtra(EXTRA_VERSE, -1)
        verse = GitaVerses.verses.firstOrNull { it.chapter == chapter && it.verse == verseNum }
            ?: GitaVerses.verseForToday()

        headerTv = findViewById(R.id.translate_header)
        sanskritTv = findViewById(R.id.translate_sanskrit)
        englishTv = findViewById(R.id.translate_english)
        translatedTv = findViewById(R.id.translate_output)
        languageSpinner = findViewById(R.id.translate_lang_spinner)
        progress = findViewById(R.id.translate_progress)

        headerTv.text = getString(R.string.verse_header, verse.chapter, verse.verse)
        sanskritTv.text = verse.sanskrit
        englishTv.text = verse.english

        val adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_item,
            languages.map { it.first }
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        languageSpinner.adapter = adapter

        languageSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(p: AdapterView<*>?, v: View?, pos: Int, id: Long) {
                translateTo(languages[pos].second)
            }
            override fun onNothingSelected(p: AdapterView<*>?) {}
        }

        // Default → Hindi (index 0). Show bundled Hindi immediately while ML Kit loads.
        translatedTv.text = verse.hindi
    }

    private fun translateTo(targetCode: String) {
        // Fast path: bundled Hindi
        if (targetCode == TranslateLanguage.HINDI) {
            translatedTv.text = verse.hindi
            progress.visibility = View.GONE
            return
        }

        progress.visibility = View.VISIBLE
        translatedTv.text = getString(R.string.translating)

        translator?.close()
        val options = TranslatorOptions.Builder()
            .setSourceLanguage(TranslateLanguage.ENGLISH)
            .setTargetLanguage(targetCode)
            .build()
        val t = Translation.getClient(options)
        translator = t

        val conditions = DownloadConditions.Builder().build()
        t.downloadModelIfNeeded(conditions)
            .addOnSuccessListener {
                t.translate(verse.english)
                    .addOnSuccessListener { result ->
                        progress.visibility = View.GONE
                        translatedTv.text = result
                    }
                    .addOnFailureListener { e ->
                        progress.visibility = View.GONE
                        translatedTv.text = getString(R.string.translate_failed)
                        Toast.makeText(this, e.localizedMessage ?: "Translate error", Toast.LENGTH_SHORT).show()
                    }
            }
            .addOnFailureListener { e ->
                progress.visibility = View.GONE
                translatedTv.text = getString(R.string.translate_model_failed)
                Toast.makeText(this, e.localizedMessage ?: "Model download failed", Toast.LENGTH_LONG).show()
            }
    }

    override fun onDestroy() {
        translator?.close()
        super.onDestroy()
    }

    companion object {
        const val EXTRA_CHAPTER = "extra_chapter"
        const val EXTRA_VERSE = "extra_verse"
    }
}
