import PageHeader from "@/components/PageHeader";

export default function AboutPage() {
  return (
    <div className="pb-10 page-enter">
      <PageHeader title="岩波理恵について" icon="🎤" />

      <div className="px-4 space-y-6 mt-2">

        {/* リード */}
        <section className="bg-white rounded-2xl p-5 border border-pink-100/50">
          <p className="text-sm leading-relaxed text-gray-700">
            長野県出身の歌謡曲シンガー・岩波理恵。元ANAの客室乗務員という異色の経歴を持ち、ラジオパーソナリティとして7年間全国放送を担当した後、徳間ジャパンからメジャーデビュー。バラードを軸に、昭和歌謡の薫りを現代に伝える歌声で幅広い世代のファンを魅了し続けている。
          </p>
        </section>

        {/* プロフィール */}
        <section>
          <SectionTitle>プロフィール</SectionTitle>
          <div className="bg-white rounded-2xl border border-pink-100/50 divide-y divide-gray-50 text-sm">
            <Row label="出身地" value="長野県諏訪郡下諏訪町" />
            <Row label="生年月日" value="1973年5月14日" />
            <Row label="身長" value="161.5 cm" />
            <Row label="血液型" value="A型" />
            <Row label="学歴" value="長野県岡谷南高等学校 → 東洋大学短期大学" />
            <Row label="所属事務所" value="トップ・カラー（2016年〜）" />
            <Row label="レコード会社" value="徳間ジャパンコミュニケーションズ" />
          </div>
        </section>

        {/* 経歴 */}
        <section>
          <SectionTitle>経歴</SectionTitle>
          <div className="space-y-4">

            <Card title="CA時代〜芸能界への転身">
              <p>
                短大卒業後、全日本空輸（ANA）の国内線客室乗務員として就職。しかし入社後に「機内では歌えない」と気づいた岩波は約2年で退職し、芸能界へ転身する。歌への情熱が、安定したキャリアを捨てる決断を後押しした。
              </p>
            </Card>

            <Card title="ラジオパーソナリティとして7年間（2003〜2010年）">
              <p>
                2003年から文化放送の深夜番組「走れ！歌謡曲」の水曜担当パーソナリティを7年間務める。歌謡曲を愛するリスナーと深夜の時間を共にしながら、昭和の名曲への造詣をさらに深めた。同時期、日本テレビの情報番組「クリック！」ではレポーターとしても活躍。2024年8月には「走れ！歌謡曲」の復活特番にも参加し、往年のリスナーと再び繋がった。
              </p>
            </Card>

            <Card title="声優・舞台へ（2008〜）">
              <p>
                2008〜2009年には、BSフジのアニメ「新科学忍者隊ガッチャピン」でガッチャピンの声を担当。歌・トーク・演技と、表現の幅を着実に広げていった。舞台では「私、農業始めます！」（2019年）や「従軍看護婦〜女たちの戦場〜」（2019年）に出演している。
              </p>
            </Card>

            <Card title="メジャーデビュー（2012年）">
              <p>
                2012年2月、徳間ジャパンより「こころ こわれそう」でメジャーデビュー。作詞・喜多條忠、作曲・杉本眞人という昭和歌謡の名コンビによる楽曲で、その歌声が初めて全国に届いた。2014年9月のシングル「こんな夜はせつなくて」より、名義を漢字の本名「岩波理恵」に改めた。
              </p>
            </Card>

            <Card title="Pococha配信とファンとの絆（2020年〜）">
              <p>
                2020年4月、ライブ配信アプリ「Pococha」での活動を開始。「見えるラジオ」と称した昭和歌謡中心の配信は、企画・進行・歌唱すべてを一人でこなすスタイルで、幅広い年代のファンとの距離を縮めた。「若い方から80代の方まで、昭和歌謡を聴いて同じように盛り上がれる。それがこの音楽の力だと思います」と岩波は語る。
              </p>
            </Card>

            <Card title="ベストアルバム発売と新章（2026年）">
              <p>
                2026年1月、初のベストアルバム「未来への坂道」をリリース。新曲「薔薇の化身」のMVも同時公開され、デビューから約14年の軌跡と新たな出発を刻んだ一枚となった。
              </p>
            </Card>

          </div>
        </section>

        {/* 音楽スタイル */}
        <section>
          <SectionTitle>音楽スタイルと歌への想い</SectionTitle>
          <div className="space-y-4">

            <Card title="バラードという居場所">
              <p>
                幼少期から中島みゆきやテレサ・テンの世界観を愛し、「バラードこそ自分の個性が発揮できる場所」と確信を持って歩んできた。師事した渡辺なつみ氏から「色彩を想像する歌唱法」を学び、「深海の青をイメージして歌う」という独自のアプローチで、切なさや儚さを繊細に表現する。
              </p>
            </Card>

            <Card title="昭和アイドルへの憧れ">
              <p>
                最大の音楽的影響として松田聖子を挙げ、ピンク・レディーの曲を幼少期から歌っていたという。「演歌」というより「歌謡ポップス」「歌謡曲」と自身のジャンルを語り、80〜90年代の歌謡エッセンスを現代のポップと融合させたスタイルで「岩波ブランド」を確立することを目指している。
              </p>
            </Card>

            <Card title="楽曲に込める現代の女性像">
              <p>
                シングル「愛が眠るまで」の主人公について、「100%相手のために身を引くのではなく、自分で恋愛を終結させる強さを持つ現代の女性像」と解釈。強がりと未練が交錯する心の揺らぎを歌に込めることを大切にしている。
              </p>
            </Card>

          </div>
        </section>

        {/* ディスコグラフィ */}
        <section>
          <SectionTitle>主な作品</SectionTitle>
          <div className="space-y-3">

            <div>
              <p className="text-xs font-bold text-gray-400 mb-2 tracking-wide">シングル</p>
              <div className="bg-white rounded-2xl border border-pink-100/50 divide-y divide-gray-50 text-sm">
                <DiscRow year="2012" title="こころ こわれそう" note="メジャーデビュー曲" />
                <DiscRow year="2013" title="流星エアポート" />
                <DiscRow year="2014" title="こんな夜はせつなくて" note="本名表記に変更" />
                <DiscRow year="2016" title="泣いたカラスの子守歌" />
                <DiscRow year="2017" title="ハローアゲイン" />
                <DiscRow year="2018" title="ベッドじゃなくても" />
                <DiscRow year="2020" title="うさぎ" />
                <DiscRow year="2022" title="愛が眠るまで" />
                <DiscRow year="2024" title="月の鱗" />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 mb-2 tracking-wide">アルバム</p>
              <div className="bg-white rounded-2xl border border-pink-100/50 divide-y divide-gray-50 text-sm">
                <DiscRow year="2016" title="ファーストアルバム〜ありがとう〜" note="全12曲" />
                <DiscRow year="2026" title="BEST ALBUM「未来への坂道」" note="新曲「薔薇の化身」収録" />
              </div>
            </div>
          </div>
        </section>

        {/* 趣味・人柄 */}
        <section>
          <SectionTitle>素顔・人柄</SectionTitle>
          <Card>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• ファンや知人の<strong>似顔絵</strong>を描いてプレゼントするほどのイラスト好き</li>
              <li>• コスメ・美容・健康に関する知識が豊富で、うんちくを語り始めると止まらない</li>
              <li>• ものまねが特技で、80年代アイドルの歌の再現も得意</li>
              <li>• 都市伝説系のYouTube動画を見るのが密かな楽しみ</li>
              <li>• 目標はNHK紅白歌合戦出場。バラエティ番組出演も積極的に望んでいる</li>
            </ul>
          </Card>
        </section>

      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-5 bg-pink-500 rounded-full" />
      <h2 className="text-base font-bold">{children}</h2>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex px-4 py-2.5 gap-4">
      <span className="text-xs text-gray-400 w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 flex-1">{value}</span>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-pink-100/50">
      {title && <p className="text-sm font-bold text-gray-800 mb-2">{title}</p>}
      <div className="text-sm leading-relaxed text-gray-600">{children}</div>
    </div>
  );
}

function DiscRow({ year, title, note }: { year: string; title: string; note?: string }) {
  return (
    <div className="flex items-center px-4 py-2.5 gap-3">
      <span className="text-xs text-gray-400 w-10 flex-shrink-0">{year}</span>
      <span className="text-sm text-gray-700 flex-1">{title}</span>
      {note && <span className="text-[0.65rem] text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full flex-shrink-0">{note}</span>}
    </div>
  );
}
