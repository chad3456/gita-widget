package com.gitawidget.app

import java.util.Calendar

/**
 * Curated verses from the Bhagavad Gita.
 * Sanskrit source: Bhagavad Gita As It Is / Gita Press Gorakhpur editions.
 * English translations follow the Gita Press / ISKCON traditions.
 * Hindi translations follow the Gita Press Gorakhpur edition.
 */
data class GitaVerse(
    val chapter: Int,
    val verse: Int,
    val sanskrit: String,
    val english: String,
    val hindi: String
)

object GitaVerses {

    val verses: List<GitaVerse> = listOf(
        GitaVerse(
            chapter = 2,
            verse = 47,
            sanskrit = "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
            english = "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.",
            hindi = "तेरा कर्म करने में ही अधिकार है, उसके फलों में कभी नहीं। इसलिए तू कर्मों के फल का हेतु मत हो तथा तेरी अकर्म में भी आसक्ति न हो।"
        ),
        GitaVerse(
            chapter = 2,
            verse = 20,
            sanskrit = "न जायते म्रियते वा कदाचि-\nन्नायं भूत्वा भविता वा न भूयः।\nअजो नित्यः शाश्वतोऽयं पुराणो\nन हन्यते हन्यमाने शरीरे॥",
            english = "For the soul there is neither birth nor death at any time. He has not come into being, does not come into being, and will not come into being. He is unborn, eternal, ever-existing and primeval. He is not slain when the body is slain.",
            hindi = "यह आत्मा किसी काल में भी न तो जन्मता है और न मरता ही है तथा न यह उत्पन्न होकर फिर होने वाला ही है क्योंकि यह अजन्मा, नित्य, सनातन और पुरातन है, शरीर के मारे जाने पर भी यह नहीं मारा जाता।"
        ),
        GitaVerse(
            chapter = 4,
            verse = 7,
            sanskrit = "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥",
            english = "Whenever and wherever there is a decline in religious practice, O descendant of Bharata, and a predominant rise of irreligion — at that time I descend Myself.",
            hindi = "हे भारत! जब-जब धर्म की हानि और अधर्म की वृद्धि होती है, तब-तब ही मैं अपने रूप को रचता हूँ अर्थात् साकार रूप से लोगों के सम्मुख प्रकट होता हूँ।"
        ),
        GitaVerse(
            chapter = 4,
            verse = 8,
            sanskrit = "परित्राणाय साधूनां विनाशाय च दुष्कृताम्।\nधर्मसंस्थापनार्थाय सम्भवामि युगे युगे॥",
            english = "To deliver the pious and to annihilate the miscreants, as well as to reestablish the principles of religion, I Myself appear, millennium after millennium.",
            hindi = "साधु पुरुषों का उद्धार करने के लिए, पाप कर्म करने वालों का विनाश करने के लिए और धर्म की अच्छी तरह से स्थापना करने के लिए मैं युग-युग में प्रकट हुआ करता हूँ।"
        ),
        GitaVerse(
            chapter = 2,
            verse = 14,
            sanskrit = "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
            english = "O son of Kunti, the nonpermanent appearance of happiness and distress, and their disappearance in due course, are like the appearance and disappearance of winter and summer seasons. They arise from sense perception, O scion of Bharata, and one must learn to tolerate them without being disturbed.",
            hindi = "हे कुन्तीपुत्र! सर्दी-गर्मी और सुख-दुःख को देने वाले इन्द्रिय और विषयों के संयोग तो उत्पत्ति-विनाशशील और अनित्य हैं, इसलिए हे भारत! उनको तू सहन कर।"
        ),
        GitaVerse(
            chapter = 6,
            verse = 5,
            sanskrit = "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
            english = "One must deliver himself with the help of his mind, and not degrade himself. The mind is the friend of the conditioned soul, and his enemy as well.",
            hindi = "अपने द्वारा अपना संसार-समुद्र से उद्धार करे और अपने को अधोगति में न डाले क्योंकि यह मनुष्य आप ही तो अपना मित्र है और आप ही अपना शत्रु है।"
        ),
        GitaVerse(
            chapter = 18,
            verse = 66,
            sanskrit = "सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।\nअहं त्वा सर्वपापेभ्यो मोक्षयिष्यामि मा शुचः॥",
            english = "Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
            hindi = "सम्पूर्ण धर्मों को अर्थात् सम्पूर्ण कर्तव्य कर्मों को मुझमें त्याग कर तू केवल एक मुझ सर्वशक्तिमान्, सर्वाधार परमेश्वर की ही शरण में आ जा। मैं तुझे सम्पूर्ण पापों से मुक्त कर दूँगा, तू शोक मत कर।"
        ),
        GitaVerse(
            chapter = 3,
            verse = 21,
            sanskrit = "यद्यदाचरति श्रेष्ठस्तत्तदेवेतरो जनः।\nस यत्प्रमाणं कुरुते लोकस्तदनुवर्तते॥",
            english = "Whatever action a great man performs, common men follow. And whatever standards he sets by exemplary acts, all the world pursues.",
            hindi = "श्रेष्ठ पुरुष जो-जो आचरण करता है, अन्य पुरुष भी वैसा-वैसा ही आचरण करते हैं। वह जो कुछ प्रमाण कर देता है, समस्त मनुष्य-समुदाय उसी के अनुसार बरतने लग जाता है।"
        ),
        GitaVerse(
            chapter = 2,
            verse = 62,
            sanskrit = "ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।\nसङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥",
            english = "While contemplating the objects of the senses, a person develops attachment for them, and from such attachment lust develops, and from lust anger arises.",
            hindi = "विषयों का चिन्तन करने वाले पुरुष की उन विषयों में आसक्ति हो जाती है, आसक्ति से उन विषयों की कामना उत्पन्न होती है और कामना में विघ्न पड़ने से क्रोध उत्पन्न होता है।"
        ),
        GitaVerse(
            chapter = 2,
            verse = 63,
            sanskrit = "क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।\nस्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥",
            english = "From anger, complete delusion arises, and from delusion bewilderment of memory. When memory is bewildered, intelligence is lost, and when intelligence is lost one falls down again into the material pool.",
            hindi = "क्रोध से अत्यन्त मूढ़भाव उत्पन्न हो जाता है, मूढ़भाव से स्मृति में भ्रम हो जाता है, स्मृति में भ्रम हो जाने से बुद्धि अर्थात् ज्ञानशक्ति का नाश हो जाता है और बुद्धि का नाश हो जाने से यह पुरुष अपनी स्थिति से गिर जाता है।"
        ),
        GitaVerse(
            chapter = 12,
            verse = 13,
            sanskrit = "अद्वेष्टा सर्वभूतानां मैत्रः करुण एव च।\nनिर्ममो निरहंकारः समदुःखसुखः क्षमी॥",
            english = "One who is not envious but is a kind friend to all living entities, who does not think himself a proprietor and is free from false ego, who is equal in both happiness and distress, who is tolerant…",
            hindi = "जो पुरुष सब भूतों में द्वेष-भाव से रहित, स्वार्थरहित सबका प्रेमी और हेतुरहित दयालु है तथा ममता से रहित, अहंकार से रहित, सुख-दुःखों की प्राप्ति में सम और क्षमावान है।"
        ),
        GitaVerse(
            chapter = 9,
            verse = 22,
            sanskrit = "अनन्याश्चिन्तयन्तो मां ये जनाः पर्युपासते।\nतेषां नित्याभियुक्तानां योगक्षेमं वहाम्यहम्॥",
            english = "But those who always worship Me with exclusive devotion, meditating on My transcendental form — to them I carry what they lack, and I preserve what they have.",
            hindi = "जो अनन्य प्रेमी भक्तजन मुझ परमेश्वर को निरन्तर चिन्तन करते हुए निष्काम भाव से भजते हैं, उन नित्य-निरन्तर मेरा चिन्तन करने वाले पुरुषों का योगक्षेम मैं स्वयं प्राप्त करा देता हूँ।"
        ),
        GitaVerse(
            chapter = 15,
            verse = 7,
            sanskrit = "ममैवांशो जीवलोके जीवभूतः सनातनः।\nमनःषष्ठानीन्द्रियाणि प्रकृतिस्थानि कर्षति॥",
            english = "The living entities in this conditioned world are My eternal fragmental parts. Due to conditioned life, they are struggling very hard with the six senses, which include the mind.",
            hindi = "इस देह में यह सनातन जीवात्मा मेरा ही अंश है और वही इन प्रकृति में स्थित मन और पाँचों इन्द्रियों को आकर्षित करता है।"
        ),
        GitaVerse(
            chapter = 7,
            verse = 7,
            sanskrit = "मत्तः परतरं नान्यत्किञ्चिदस्ति धनञ्जय।\nमयि सर्वमिदं प्रोतं सूत्रे मणिगणा इव॥",
            english = "O conqueror of wealth, there is no truth superior to Me. Everything rests upon Me, as pearls are strung on a thread.",
            hindi = "हे धनञ्जय! मुझसे भिन्न दूसरा कोई भी परम कारण नहीं है। यह सम्पूर्ण जगत् सूत्र में सूत्र के मणियों के सदृश मुझमें गुँथा हुआ है।"
        ),
        GitaVerse(
            chapter = 6,
            verse = 6,
            sanskrit = "बन्धुरात्मात्मनस्तस्य येनात्मैवात्मना जितः।\nअनात्मनस्तु शत्रुत्वे वर्तेतात्मैव शत्रुवत्॥",
            english = "For him who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, his very mind will be the greatest enemy.",
            hindi = "जिस जीवात्मा द्वारा मन और इन्द्रियों सहित शरीर जीता हुआ है, उस जीवात्मा का तो वह आप ही मित्र है और जिसके द्वारा मन तथा इन्द्रियों सहित शरीर नहीं जीता गया है, उसके लिए वह आप ही शत्रु के सदृश शत्रुता में बरतता है।"
        ),
        GitaVerse(
            chapter = 5,
            verse = 18,
            sanskrit = "विद्याविनयसम्पन्ने ब्राह्मणे गवि हस्तिनि।\nशुनि चैव श्वपाके च पण्डिताः समदर्शिनः॥",
            english = "The humble sages, by virtue of true knowledge, see with equal vision a learned and gentle brāhmaṇa, a cow, an elephant, a dog and a dog-eater.",
            hindi = "वे ज्ञानीजन विद्या और विनय से युक्त ब्राह्मण में तथा गौ, हाथी, कुत्ते और चाण्डाल में भी समदर्शी ही होते हैं।"
        ),
        GitaVerse(
            chapter = 6,
            verse = 19,
            sanskrit = "यथा दीपो निवातस्थो नेङ्गते सोपमा स्मृता।\nयोगिनो यतचित्तस्य युञ्जतो योगमात्मनः॥",
            english = "As a lamp in a windless place does not waver, so the transcendentalist, whose mind is controlled, remains always steady in his meditation on the transcendent Self.",
            hindi = "जैसे वायुरहित स्थान में स्थित दीपक चलायमान नहीं होता, वैसी ही उपमा परमात्मा के ध्यान में लगे हुए योगी के जीते हुए चित्त की कही गई है।"
        ),
        GitaVerse(
            chapter = 4,
            verse = 39,
            sanskrit = "श्रद्धावाँल्लभते ज्ञानं तत्परः संयतेन्द्रियः।\nज्ञानं लब्ध्वा परां शान्तिमचिरेणाधिगच्छति॥",
            english = "A faithful man who is dedicated to transcendental knowledge and who subdues his senses is eligible to achieve such knowledge, and having achieved it he quickly attains the supreme spiritual peace.",
            hindi = "जितेन्द्रिय, साधनपरायण और श्रद्धावान् मनुष्य ज्ञान को प्राप्त होता है तथा ज्ञान को प्राप्त होकर वह बिना विलम्ब के तत्काल ही भगवत्प्राप्तिरूप परम शान्ति को प्राप्त हो जाता है।"
        ),
        GitaVerse(
            chapter = 8,
            verse = 7,
            sanskrit = "तस्मात्सर्वेषु कालेषु मामनुस्मर युध्य च।\nमय्यर्पितमनोबुद्धिर्मामेवैष्यस्यसंशयम्॥",
            english = "Therefore, Arjuna, you should always think of Me in the form of Krishna and at the same time carry out your prescribed duty of fighting. With your activities dedicated to Me and your mind and intelligence fixed on Me, you will attain Me without doubt.",
            hindi = "इसलिए हे अर्जुन! तू सब समय में निरन्तर मेरा स्मरण कर और युद्ध भी कर। इस प्रकार मुझमें अर्पण किए हुए मन-बुद्धि से युक्त होकर तू निःसन्देह मुझको ही प्राप्त होगा।"
        ),
        GitaVerse(
            chapter = 3,
            verse = 35,
            sanskrit = "श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्।\nस्वधर्मे निधनं श्रेयः परधर्मो भयावहः॥",
            english = "It is far better to discharge one's prescribed duties, even though faultily, than another's duties perfectly. Destruction in the course of performing one's own duty is better than engaging in another's duties, for to follow another's path is dangerous.",
            hindi = "अच्छी प्रकार आचरण में लाए हुए दूसरे के धर्म से गुणरहित भी अपना धर्म अति उत्तम है। अपने धर्म में तो मरना भी कल्याणकारक है और दूसरे का धर्म भय को देने वाला है।"
        )
    )

    /** Returns today's verse — rotates daily based on day-of-year. */
    fun verseForToday(): GitaVerse {
        val cal = Calendar.getInstance()
        val dayOfYear = cal.get(Calendar.DAY_OF_YEAR)
        val year = cal.get(Calendar.YEAR)
        val index = ((dayOfYear + year) % verses.size + verses.size) % verses.size
        return verses[index]
    }

    fun verseAt(index: Int): GitaVerse = verses[((index % verses.size) + verses.size) % verses.size]
}
