const PseudoBDD = require('./data.js').PseudoBDD

// Generating a random phrase
function Phrase (options) {
  options = {}

  // Fonctions
  this.lire = function () { return this.corps }
  this.assembler = function () {
    let resultat = this.mots.join(' ')
    resultat = resultat.replace(/ ,/g, ',')
    resultat = resultat.replace(/' /g, "'")
    resultat = resultat.replace(/à [Ll]es /g, 'aux ')
    resultat = resultat.replace(/à [Ll]e /g, 'au ')
    resultat = resultat.replace(/ en [Ll]e /g, ' en ')
    resultat = resultat.replace(/ de ([AEIOUHYaeiouhyéèêàùäëïöüœ])/gi, " d'$1")
    resultat = resultat.replace(/ que ([AEIOUHYaeiouhyéèêàùäëïöüœ])/gi, " qu'$1")
    resultat = resultat.replace(/plus des ([aeiouhyéèêàùäëïöüœ])/gi, "plus d'$1")
    resultat = resultat.replace(/ de [Ll]es /g, ' des ')
    resultat = resultat.replace(/ de de(s)? ([aeiouéèêàîïùyhœ])/gi, " d'$2")
    resultat = resultat.replace(/ de de(s)? ([^aeiouéèêàîïùyhœ])/gi, ' de $2')
    resultat = resultat.replace(/ de [Dd]'/g, " d'")
    resultat = resultat.replace(/ de ([Ll]e|du) /g, ' du ')
    if (!this.questionInv) resultat = resultat.replace(/je ([aeiouéèêàîïùyhœ])/i, "j'$1")
    resultat = resultat.replace(/£/g, 'h').replace(/µ/g, 'Y').replace(/¥/g, 'y')
    this.corps = resultat
  }
  this.ponctuer = function (isAQuestion) {
    let probaPoint
    if (isAQuestion) {
      probaPoint = this.PROBA_POINT_FINAL_QUESTIONS
    } else {
      probaPoint = this.PROBA_POINT_FINAL
    }
    this.corps = this.corps.substr(0, 1).toUpperCase() + this.corps.substr(1)
    this.corps += probaSwitch(Grimoire.recupererListe('PF'), probaPoint)
  }
  this.PROBA_POINT_FINAL = [8, 1, 1, 0]
  this.PROBA_POINT_FINAL_QUESTIONS = [0, 0, 0, 1]
  this.structure = Grimoire.genererStructure()
  this.structureInitiale = this.structure.cloner()
  this.mots = []
  this.questionSimple = false
  this.questionInv = false
  this.PP = false
  this.genreSujet = ''

  let seuilSimple, seuilInv
  switch (Generateur.Memoire.modeInterrogatif) {
    case 'libre':
      seuilSimple = 94
      seuilInv = 77
      break
    case 'interdit':
      seuilSimple = 100
      seuilInv = 100
      break
    case 'forcé':
      seuilSimple = 78
      seuilInv = 0
      break
  }
  const tirageModeInterrogatif = de(100)
  if (tirageModeInterrogatif > seuilSimple) {
    this.questionSimple = true
  } else if (tirageModeInterrogatif > seuilInv) {
    this.questionInv = true
  }

  let posVerbe = -1; let posVerbe2 = -1; let posModal = -1; let posQue = -1; let posPR = -1
  let personne = 0; let temps = -1
  let premierGN = 0; const advPost = false; let flagNoNeg = false
  let particules = []

  const preAdverbeCheck = (this.structure.indexOf('AP') > -1)

  /* --- BOUCLE SUR LES BLOCS DE LA STRUCTURE --- */
  for (let i = 0, iMax = this.structure.length; i < iMax; ++i) {
    if (this.structure[i].substr(0, 1) === '§') {
      let litteral = this.structure[i].substr(1)
      if (litteral.indexOf('/') > -1) {
        litteral = litteral.split('/')[(de(2) - 1)]
      }
      this.mots.push(litteral)
      if (litteral === 'sans') {
        flagNoNeg = true
      }
    } else {
      let mot
      let chercheParticule
      let pronoms
      do {
        switch (this.structure[i]) {
          case 'GN':
            if (options.sujetChoisi && !premierGN) {
              mot = options.sujetChoisi
              pronoms = /^(je|tu|il|elle|nous|vous|ils|elles)@\d$/i
              if (pronoms.test(mot)) {
                this.PP = true
              }
              this.genreSujet = 'F'
            } else {
              if (de(11) > 1) {
                mot = Generateur.groupeNominal(premierGN)
                if (mot.indexOf('_PP') > -1) {
                  mot = mot.replace(/_PP/, '')
                  this.PP = true
                }
              } else {
                mot = Grimoire.recupererMot(this.structure[i])
              }
              if (!premierGN) this.genreSujet = (mot.indexOf('__F') > -1) ? 'F' : 'H'
              mot = mot.replace(/__F/, '')
            }
            if (!premierGN) premierGN = (i + 1)
            break
          case 'CO':
            if (de(11) > 1) {
              mot = Generateur.complementObjet(personne)
            } else {
              mot = Grimoire.recupererMot(this.structure[i])
            }
            break
          case 'VET':
            mot = Grimoire.recupererMot((de(8) > 7) ? 'VT' : 'VET')
            break
          case 'VAV':
            mot = Grimoire.recupererMot((de(10) > 9) ? 'VT' : 'VAV')
            break
          default:
            mot = Grimoire.recupererMot(this.structure[i])
        }

        chercheParticule = mot.match(/(.*)\{(.*)\}/)// not boobs, I swear. Ok, I don't swear but seriously.
        if (chercheParticule) {
          particules[i] = chercheParticule[2]
          mot = chercheParticule[1]
        }
      }
      while (preAdverbeCheck && chercheParticule && (particules = []))

      const posPersonne = mot.indexOf('@')
      if (posPersonne > -1) {
        personne = (personne > 0) ? personne : parseInt(mot.substr(posPersonne + 1), 10)
        mot = mot.substr(0, posPersonne)
      }
      this.mots.push(mot)
    }

    const verbesNonMod = ['VT', 'VN', 'VOA', 'VOD', 'VOI', 'VTL', 'VAV', 'VET', 'VOS']
    const verbesMod = ['VM', 'VD', 'VA']
    if (verbesNonMod.indexOf(this.structure[i]) > -1) {
      if (posVerbe > -1) {
        if (posModal > -1) {
          posVerbe2 = i
        } else {
          posModal = posVerbe
          posVerbe = i
        }
      } else {
        posVerbe = i
      }
    }
    if (verbesMod.indexOf(this.structure[i]) > -1) {
      posModal = i
    }

    if (this.structure[i] === '§que') {
      posQue = i
    }

    if (this.structure[i] === 'CT') {
      const posTemps = this.mots[i].indexOf('¤')
      if (posTemps > -1) {
        temps = parseInt(this.mots[i].substr(posTemps + 1), 10)
        this.mots[i] = this.mots[i].substr(0, posTemps)
      }
      while (this.mots[i].indexOf('$') > -1) {
        let nom
        do {
          nom = Generateur.GN.nomsPropres.puiser().replace(/_F/, '')
        }
        while (this.mots[i].indexOf(nom) > -1)
        this.mots[i] = this.mots[i].replace(/\$/, nom)
      }
      this.mots[i] = this.mots[i].replace(/ de ([aeiouyhéèâœ])/gi, " d'$1")
    }

    if ((this.structure[i] === 'CL') || (this.structure[i] === 'AF')) {
      while (this.mots[i].indexOf('$') > -1) {
        let nom
        do {
          nom = Generateur.GN.nomsPropres.puiser().replace(/_F/, '')
        }
        while (this.mots[i].indexOf(nom) > -1)
        this.mots[i] = this.mots[i].replace(/\$/, nom)
      }
      this.mots[i] = this.mots[i].replace(/ de ([aeiouyhéèâœ])/gi, " d'$1")

      while (this.mots[i].indexOf('+') > -1) {
        const posPlus = this.mots[i].indexOf('+')
        const fem = this.mots[i].charAt(posPlus + 1) === 'F'

        let nom, ok
        do {
          ok = true
          nom = Generateur.GN.nomsCommuns.puiser()
          if (nom.indexOf('_') > -1) {
            const pos = nom.indexOf('_')
            const genre = nom.charAt(pos + 1)
            if (!fem && ((genre === 'F') || (fem && genre === 'H'))) {
              ok = false
            } else {
              nom = nom.split('_')[0]
            }
          } else {
            const pos = nom.indexOf('%')
            if (nom.substr(pos + 1).length === 1) {
              nom = nom.replace(/(.*)%e/, '$1%$1e')
            }
            nom = nom.split('%')[((fem) ? 1 : 0)]
          }
        }
        while ((!ok) || (nom === undefined))
        nom = Generateur.accordPluriel(nom, false)
        this.mots[i] = this.mots[i].replace(/\+[FH]/, nom)
      }
      this.mots[i] = this.mots[i].replace(/ de ([aeiouyhéèâœ])/gi, " d'$1")
    }

    if ((this.structure[i] === 'CL') || (this.structure[i] === 'CT') || (this.structure[i] === 'AF')) {
      let nombre
      while (this.mots[i].indexOf('&') > -1) {
        nombre = de(10) + 1
        if (this.mots[i].indexOf('&0') > -1) {
          nombre = (nombre * 10) - 10
        }
        if (this.mots[i].indexOf('&00') > -1) {
          nombre *= 10
        }
        nombre = nombre.enLettres()
        this.mots[i] = this.mots[i].replace(/&(0){0,2}/, nombre)
      }
    }

    if (this.structure[i].split('_')[0] === 'PR') {
      posPR = i
    }
  } /* --- FIN DE LA BOUCLE SUR LES BLOCS DE LA STRUCTURE --- */

  if (temps === -1) {
    temps = (de(2) > 1) ? 2 : de(3)
  }

  if (this.questionInv && (this.mots[premierGN - 1] === 'je') && (temps === 2) && (de(5) > 2)) {
    this.questionInv = false
    this.questionSimple = true
  }

  if (posQue > -1) {
    this.mots[posQue] = (this.mots[posQue + 1].voyelle()) ? "qu'" : 'que'
  }

  if (posPR > -1) {
    let tPers = 2
    if ((/^s('|e )/).test(this.mots[posPR])) {
      tPers = [2, personne]
    }
    let neg1 = ''; let neg2 = ''
    if ((!flagNoNeg) && (de(13) > 12)) {
      neg1 = (this.mots[posPR].voyelle()) ? "n'" : 'ne '
      neg2 = ' ' + probaSwitch(Grimoire.recupererListe('NG'), Grimoire.PROBA_NEGATIONS)
    }
    this.mots[posPR] = 'en ' + neg1 + Grimoire.conjuguer(this.mots[posPR], 4, tPers, false, this.genreSujet) + neg2
  }

  if (posModal > -1) {
    let baseVerbe = Grimoire.conjuguer(this.mots[posModal], temps, personne, this.questionInv, this.genreSujet)
    if (!flagNoNeg && !advPost && (de(13) > 12)) {
      const voyelle = baseVerbe.voyelle()
      const neg = probaSwitch(Grimoire.recupererListe('NG'), Grimoire.PROBA_NEGATIONS)
      baseVerbe = ((voyelle) ? "n'" : 'ne ') + baseVerbe + ' ' + neg
    }
    this.mots[posModal] = baseVerbe

    if (this.mots[posVerbe].indexOf('#') > -1) {
      this.mots[posVerbe] = this.mots[posVerbe].split('#')[0]
    }
    if (((personne % 3) !== 0) && (/^s('|e )/).test(this.mots[posVerbe])) {
      let pr = Grimoire.pronomsReflexifs[personne - 1] + ' '
      if ((this.mots[posVerbe].indexOf("'") > -1) && (personne < 3)) {
        pr = pr.replace(/e /, "'")
      }
      this.mots[posVerbe] = this.mots[posVerbe].replace(/s('|e )/, pr)
    }
    if (!flagNoNeg && (de(13) > 12)) {
      const neg2 = probaSwitch(Grimoire.recupererListe('NG'), Grimoire.PROBA_NEGATIONS)
      this.mots[posVerbe] = 'ne ' + neg2 + ' ' + this.mots[posVerbe]
    }
    if (posVerbe2 > -1) {
      if (this.mots[posVerbe2].indexOf('#') > -1) {
        this.mots[posVerbe2] = this.mots[posVerbe2].split('#')[0]
      }
      if (((personne % 3) !== 0) && (/^s('|e )/).test(this.mots[posVerbe2])) {
        let pr = Grimoire.pronomsReflexifs[personne - 1] + ' '
        if ((this.mots[posVerbe2].indexOf("'") > -1) && (personne < 3)) {
          pr = pr.replace(/e /, "'")
        }
        this.mots[posVerbe2] = this.mots[posVerbe2].replace(/s('|e )/, pr)
      }
      if (!flagNoNeg && (de(13) > 12)) {
        const neg2 = probaSwitch(Grimoire.recupererListe('NG'), Grimoire.PROBA_NEGATIONS)
        this.mots[posVerbe2] = 'ne ' + neg2 + ' ' + this.mots[posVerbe2]
      }
    }
  } else if (posVerbe > -1) {
    let baseVerbe = Grimoire.conjuguer(this.mots[posVerbe], temps, personne, this.questionInv, this.genreSujet)
    // ligne après l'alert, double wtf : la ligne de code en elle-même ET le commentaire ^^'
    // Plus la moindre idée de ce que ça pouvait vouloir signifier mais ça sent la rustine de merde
    // à dégager ASAP
    if (baseVerbe === undefined) alert('copine')// préparation du nuke de la copine connasse
    if (baseVerbe === undefined) return new Phrase(options)// et sa copine
    if (!flagNoNeg && !advPost && (de(13) > 12)) {
      const voyelle = baseVerbe.voyelle()
      const neg = probaSwitch(Grimoire.recupererListe('NG'), Grimoire.PROBA_NEGATIONS)
      baseVerbe = ((voyelle) ? "n'" : 'ne ') + baseVerbe + ' ' + neg
    }
    this.mots[posVerbe] = baseVerbe
  }

  for (let i = 0; i < this.mots.length; ++i) {
    if (particules[i]) this.mots[i] += ' ' + particules[i]
  }

  if (this.questionInv) {
    if (this.PP) {
      this.mots.splice(premierGN - 1, 1)
      this.structure.splice(premierGN - 1, 1)
      this.structure[premierGN - 1] += '-GN'
    }
    if (de(2) > 1) {
      let adjectifsDispo = Grimoire.adjectifsInterrogatifs.cloner()
      let probas = Grimoire.PROBA_ADJECTIFS_INTERROGATIFS.cloner()
      if (this.structure.indexOf('CT') === -1) {
        adjectifsDispo = adjectifsDispo.concat(Grimoire.adjectifsInterrogatifsTemps)
        probas = probas.concat(Grimoire.PROBA_ADJECTIFS_INTERROGATIFS_TEMPS)
      }
      if (this.structure.indexOf('CL') === -1) {
        adjectifsDispo = adjectifsDispo.concat(Grimoire.adjectifsInterrogatifsLieu)
        probas = probas.concat(Grimoire.PROBA_ADJECTIFS_INTERROGATIFS_LIEU)
      }
      if ((this.structure.indexOf('AP') === -1) && (this.structure.indexOf('AF') === -1)) {
        adjectifsDispo = adjectifsDispo.concat(Grimoire.adjectifsInterrogatifsManiere)
        probas = probas.concat(Grimoire.PROBA_ADJECTIFS_INTERROGATIFS_MANIERE)
      }
      this.mots.splice(premierGN - 1, 0, probaSwitch(adjectifsDispo, probas))
      this.structure.splice(premierGN - 1, 0, 'AI')
    }
  }

  if (this.questionSimple) {
    this.mots.splice(premierGN - 1, 0, 'est-ce que')
    this.structure.splice(premierGN - 1, 0, 'QS')
  }

  this.assembler()
  this.ponctuer(this.questionSimple || this.questionInv)
  return this
}

const Grimoire = {
  genererStructure: function () {
    const str = []
    let flagCT = false; let flagCL = false; let flagAP = false

    if (de(100) < 7) {
      if (de(100) < 50) {
        str.push('CT')
        flagCT = true
      } else {
        str.push('CL')
        flagCL = true
      }
      str.push('VG')
    }

    str.push('GN')

    if (de(100) < 26) {
      const tirageModal = de(100)
      if (tirageModal < 37) {
        str.push('VM')
      } else if (tirageModal < 69) {
        str.push('VD')
        str.push('§de')
      } else {
        str.push('VA')
        str.push('§à')
      }

      if (de(100) < 4) {
        str.push('AP')
        flagAP = true
      }
    }

    const verbesNonMod = ['VT', 'VN', 'VOA', 'VOD', 'VOI', 'VTL', 'VAV', 'VET', 'VOS']
    const probasVerbes = [5, 5, 3, 3, 2, 2, 1, 1, 2]
    let verbe
    do {
      verbe = probaSwitch(verbesNonMod, probasVerbes)
    }
    while ((flagCL) && (verbe === 'VTL'))
    str.push(verbe)

    let seuilAP = (flagAP) ? 2 : 5
    if (de(100) < seuilAP) {
      str.push('AP')
      flagAP = true
    }

    switch (verbe) {
      case 'VT':
        str.push((de(4) > 1) ? 'CO' : 'GN')
        break
      case 'VTL':
        str.push('CL')
        flagCL = true
        break
      case 'VOA':
        str.push('§à')
        str.push((de(4) > 1) ? 'CO' : 'GN')
        break
      case 'VOD':
        str.push('§de')
        str.push((de(4) > 1) ? 'CO' : 'GN')
        break
      case 'VOS':
        str.push('§sur')
        str.push((de(4) > 1) ? 'CO' : 'GN')
        break
      case 'VOI':
        str.push((de(11) > 1) ? 'CO' : 'GN')
        str.push('§à')
        str.push((de(11) > 1) ? 'GN' : 'CO')
        break
      case 'VAV':
        str.push((de(5) > 1) ? 'CO' : 'GN')
        str.push('§avec')
        str.push((de(5) > 1) ? 'CO' : 'GN')
        break
      case 'VET':
        str.push((de(5) > 1) ? 'CO' : 'GN')
        str.push('§et')
        str.push((de(5) > 1) ? 'CO' : 'GN')
        break
    }

    if (de(100) < 20) {
      const tirageVerbeSuite = de(100)
      if (tirageVerbeSuite < 25) {
        str.push('PR_N')
        seuilAP = (flagAP) ? 2 : 5
        if (de(100) < seuilAP) {
          str.push('AP')
          flagAP = true
        }
      } else if (tirageVerbeSuite < 50) {
        str.push('PR_T')
        seuilAP = (flagAP) ? 2 : 5
        if (de(100) < seuilAP) {
          str.push('AP')
          flagAP = true
        }
        str.push((de(4) > 1) ? 'CO' : 'GN')
      } else {
        str.push((tirageVerbeSuite < 75) ? '§sans' : '§pour')
        do {
          verbe = probaSwitch(verbesNonMod, probasVerbes)
        }
        while ((flagCL) && (verbe === 'VTL'))
        str.push(verbe)

        seuilAP = (flagAP) ? 2 : 5
        if (de(100) < seuilAP) {
          str.push('AP')
          flagAP = true
        }

        switch (verbe) {
          case 'VT':
            str.push((de(4) > 1) ? 'CO' : 'GN')
            break
          case 'VTL':
            str.push('CL')
            flagCL = true
            break
          case 'VOA':
            str.push('§à')
            str.push((de(4) > 1) ? 'CO' : 'GN')
            break
          case 'VOD':
            str.push('§de')
            str.push((de(4) > 1) ? 'CO' : 'GN')
            break
          case 'VOS':
            str.push('§sur')
            str.push((de(4) > 1) ? 'CO' : 'GN')
            break
          case 'VOI':
            str.push((de(11) > 1) ? 'CO' : 'GN')
            str.push('§à')
            str.push((de(11) > 1) ? 'CO' : 'GN')
            break
          case 'VAV':
            str.push((de(5) > 1) ? 'CO' : 'GN')
            str.push('§avec')
            str.push((de(5) > 1) ? 'CO' : 'GN')
            break
          case 'VET':
            str.push((de(5) > 1) ? 'CO' : 'GN')
            str.push('§et')
            str.push((de(5) > 1) ? 'CO' : 'GN')
            break
        }
      }
    }

    if (de(100) < 12) {
      const optionsFin = ['CT', 'CL', 'AF']
      const probasFin = [3, 3, 5]
      let fin
      do {
        fin = probaSwitch(optionsFin, probasFin)
      }
      while (((flagCT) && (fin === 'CT')) || ((flagCL) && (fin === 'CL')))
      str.push(fin)
    }

    for (let i = 0, iMax = str.length; i < iMax; ++i) {
      if (str[i] === 'AP') {
        if (str[i - 1].substr(0, 1) === '§') {
          str[i] = str[i - 1]
          str[i - 1] = 'AP'
        }
      }
    }

    return str
  },

  listerStructures: function () {
    let liste = []
    let proto

    for (let i = 0, iMax = 3; i < iMax; ++i) { // 3 cas : [CT, VG, GN] ou [CL, VG, GN] ou [GN]
      proto = []
      switch (i) {
        case 0:
          proto.push('CT'); proto.push('VG'); break
        case 1:
          proto.push('CL'); proto.push('VG'); break
      }
      proto.push('GN')
      liste.push(proto)
    }

    let memListe = liste.cloner()
    liste = []
    // 1 cas par verbe modal possible (ou absence de modal)(+ 3 pour les éventuels AP)(total : 7)
    for (let i = 0, iMax = 7; i < iMax; ++i) {
      proto = memListe.cloner()
      switch (i) {
        case 0: proto.pushEach('VM'); break
        case 1: proto.pushEach('VD', '§de'); break
        case 2: proto.pushEach('VA', '§à'); break
        case 3: proto.pushEach('VM', 'AP'); break
        case 4: proto.pushEach('VD', 'AP', '§de'); break
        case 5: proto.pushEach('VA', 'AP', '§à'); break
      }
      for (let j = 0, jMax = proto.length; j < jMax; ++j) {
        liste.push(proto[j])
      }
    }

    memListe = liste.cloner()
    liste = []
    // 1 cas par verbe principal possible (44 actuellement)
    for (let i = 0, iMax = 44; i < iMax; ++i) {
      proto = memListe.cloner()
      switch (i) {
        case 0: proto.pushEach('VN'); break
        case 1: proto.pushEach('VN', 'AP'); break
        case 2: proto.pushEach('VT', 'CO'); break
        case 3: proto.pushEach('VT', 'GN'); break
        case 4: proto.pushEach('VT', 'AP', 'GN'); break
        case 5: proto.pushEach('VT', 'AP', 'CO'); break
        case 6: proto.pushEach('VTL', 'CL'); break
        case 7: proto.pushEach('VTL', 'AP', 'CL'); break
        case 8: proto.pushEach('VOA', '§à', 'CO'); break
        case 9: proto.pushEach('VOD', '§de', 'CO'); break
        case 10: proto.pushEach('VOS', '§sur', 'CO'); break
        case 11: proto.pushEach('VOA', '§à', 'GN'); break
        case 12: proto.pushEach('VOD', '§de', 'GN'); break
        case 13: proto.pushEach('VOS', '§sur', 'GN'); break
        case 14: proto.pushEach('VOA', 'AP', '§à', 'CO'); break
        case 15: proto.pushEach('VOD', 'AP', '§de', 'CO'); break
        case 16: proto.pushEach('VOS', 'AP', '§sur', 'CO'); break
        case 17: proto.pushEach('VOA', 'AP', '§à', 'GN'); break
        case 18: proto.pushEach('VOD', 'AP', '§de', 'GN'); break
        case 19: proto.pushEach('VOS', 'AP', '§sur', 'GN'); break
        case 20: proto.pushEach('VOI', 'CO', '§à', 'GN'); break
        case 21: proto.pushEach('VOI', 'CO', '§à', 'CO'); break
        case 22: proto.pushEach('VOI', 'GN', '§à', 'GN'); break
        case 23: proto.pushEach('VOI', 'GN', '§à', 'CO'); break
        case 24: proto.pushEach('VOI', 'AP', 'CO', '§à', 'GN'); break
        case 25: proto.pushEach('VOI', 'AP', 'CO', '§à', 'CO'); break
        case 26: proto.pushEach('VOI', 'AP', 'GN', '§à', 'GN'); break
        case 27: proto.pushEach('VOI', 'AP', 'CO', '§à', 'CO'); break
        case 28: proto.pushEach('VET', 'CO', '§et', 'CO'); break
        case 29: proto.pushEach('VET', 'GN', '§et', 'CO'); break
        case 30: proto.pushEach('VET', 'CO', '§et', 'GN'); break
        case 31: proto.pushEach('VET', 'GN', '§et', 'GN'); break
        case 32: proto.pushEach('VET', 'AP', 'CO', '§et', 'CO'); break
        case 33: proto.pushEach('VET', 'AP', 'GN', '§et', 'CO'); break
        case 34: proto.pushEach('VET', 'AP', 'CO', '§et', 'GN'); break
        case 35: proto.pushEach('VET', 'AP', 'GN', '§et', 'GN'); break
        case 36: proto.pushEach('VAV', 'CO', '§avec', 'CO'); break
        case 37: proto.pushEach('VAV', 'GN', '§avec', 'CO'); break
        case 38: proto.pushEach('VAV', 'CO', '§avec', 'GN'); break
        case 39: proto.pushEach('VAV', 'GN', '§avec', 'GN'); break
        case 40: proto.pushEach('VAV', 'AP', 'CO', '§avec', 'CO'); break
        case 41: proto.pushEach('VAV', 'AP', 'GN', '§avec', 'CO'); break
        case 42: proto.pushEach('VAV', 'AP', 'CO', '§avec', 'GN'); break
        case 43: proto.pushEach('VAV', 'AP', 'GN', '§avec', 'GN'); break
      }
      for (let j = 0, jMax = proto.length; j < jMax; ++j) {
        liste.push(proto[j])
      }
    }

    memListe = liste.cloner()
    liste = []
    // 1 cas par type de proposition finale (rien / §sans / §pour / PR_T ... / PR_N) (total : 8 (+ N sous-cas dans §sans/pour))
    for (let i = 0, iMax = 7; i < iMax; ++i) {
      proto = memListe.cloner()
      switch (i) {
        case 0: proto.pushEach('PR_N'); break
        case 1: proto.pushEach('PR_N', 'AP'); break
        case 2: proto.pushEach('PR_T', 'CO'); break
        case 3: proto.pushEach('PR_T', 'GN'); break
        case 4: proto.pushEach('PR_T', 'AP', 'CO'); break
        case 5: proto.pushEach('PR_T', 'AP', 'GN'); break
      }
      for (let j = 0, jMax = proto.length; j < jMax; ++j) {
        liste.push(proto[j])
      }
    }

    let idx = 0
    while (++idx <= 2) {
      // "repasser" dans la boucle des verbes principaux (+ AP) (+ objets)
      // 1 cas par verbe principal possible (44 actuellement)
      for (let k = 0, kMax = 44; k < kMax; ++k) {
        proto = memListe.cloner()
        proto.pushEach(((idx % 2) === 0) ? '§sans' : '§pour')
        switch (k) {
          case 0: proto.pushEach('VN'); break
          case 1: proto.pushEach('VN', 'AP'); break
          case 2: proto.pushEach('VT', 'CO'); break
          case 3: proto.pushEach('VT', 'GN'); break
          case 4: proto.pushEach('VT', 'AP', 'GN'); break
          case 5: proto.pushEach('VT', 'AP', 'CO'); break
          case 6: proto.pushEach('VTL', 'CL'); break
          case 7: proto.pushEach('VTL', 'AP', 'CL'); break
          case 8: proto.pushEach('VOA', '§à', 'CO'); break
          case 9: proto.pushEach('VOD', '§de', 'CO'); break
          case 10: proto.pushEach('VOS', '§sur', 'CO'); break
          case 11: proto.pushEach('VOA', '§à', 'GN'); break
          case 12: proto.pushEach('VOD', '§de', 'GN'); break
          case 13: proto.pushEach('VOS', '§sur', 'GN'); break
          case 14: proto.pushEach('VOA', 'AP', '§à', 'CO'); break
          case 15: proto.pushEach('VOD', 'AP', '§de', 'CO'); break
          case 16: proto.pushEach('VOS', 'AP', '§sur', 'CO'); break
          case 17: proto.pushEach('VOA', 'AP', '§à', 'GN'); break
          case 18: proto.pushEach('VOD', 'AP', '§de', 'GN'); break
          case 19: proto.pushEach('VOS', 'AP', '§sur', 'GN'); break
          case 20: proto.pushEach('VOI', 'CO', '§à', 'GN'); break
          case 21: proto.pushEach('VOI', 'CO', '§à', 'CO'); break
          case 22: proto.pushEach('VOI', 'GN', '§à', 'GN'); break
          case 23: proto.pushEach('VOI', 'GN', '§à', 'CO'); break
          case 24: proto.pushEach('VOI', 'AP', 'CO', '§à', 'GN'); break
          case 25: proto.pushEach('VOI', 'AP', 'CO', '§à', 'CO'); break
          case 26: proto.pushEach('VOI', 'AP', 'GN', '§à', 'GN'); break
          case 27: proto.pushEach('VOI', 'AP', 'CO', '§à', 'CO'); break
          case 28: proto.pushEach('VET', 'CO', '§et', 'CO'); break
          case 29: proto.pushEach('VET', 'GN', '§et', 'CO'); break
          case 30: proto.pushEach('VET', 'CO', '§et', 'GN'); break
          case 31: proto.pushEach('VET', 'GN', '§et', 'GN'); break
          case 32: proto.pushEach('VET', 'AP', 'CO', '§et', 'CO'); break
          case 33: proto.pushEach('VET', 'AP', 'GN', '§et', 'CO'); break
          case 34: proto.pushEach('VET', 'AP', 'CO', '§et', 'GN'); break
          case 35: proto.pushEach('VET', 'AP', 'GN', '§et', 'GN'); break
          case 36: proto.pushEach('VAV', 'CO', '§avec', 'CO'); break
          case 37: proto.pushEach('VAV', 'GN', '§avec', 'CO'); break
          case 38: proto.pushEach('VAV', 'CO', '§avec', 'GN'); break
          case 39: proto.pushEach('VAV', 'GN', '§avec', 'GN'); break
          case 40: proto.pushEach('VAV', 'AP', 'CO', '§avec', 'CO'); break
          case 41: proto.pushEach('VAV', 'AP', 'GN', '§avec', 'CO'); break
          case 42: proto.pushEach('VAV', 'AP', 'CO', '§avec', 'GN'); break
          case 43: proto.pushEach('VAV', 'AP', 'GN', '§avec', 'GN'); break
        }
        for (let m = 0, mMax = proto.length; m < mMax; ++m) {
          liste.push(proto[m])
        }
      }
    }

    memListe = liste.cloner()
    liste = []
    // 1 cas par fin possible (ou absence de fin)(total : 4)
    for (let i = 0, iMax = 4; i < iMax; ++i) {
      proto = memListe.cloner()
      switch (i) {
        case 0:
          proto.pushEach('AF')
          break
        case 1:
          for (let j = 0, jMax = proto.length; j < jMax; ++j) {
            if (proto[j].indexOf('CL') === -1) {
              proto[j].push('CL')
            }
          }
          break
        case 2:
          for (let j = 0, jMax = proto.length; j < jMax; ++j) {
            if (proto[j].indexOf('CT') === -1) {
              proto[j].push('CT')
            }
          }
          break
      }
      for (let j = 0, jMax = proto.length; j < jMax; ++j) {
        liste.push(proto[j])
      }
    }

    return liste
  },

  decoderStructure: function (code) {
    let question
    if (code.indexOf('-') > -1) {
      code = code.split('-')[0]
      question = true
    }
    let traduction
    switch (code) {
      case 'GN': traduction = "[quelqu'un]<hr/>sujet de la phrase, groupe ou individu"; break
      case 'CO': traduction = "[quelque chose]<hr/>objet de l'action"; break
      case 'CL': traduction = '[à tel endroit]<hr/>complément de lieu'; break
      case 'CT': traduction = '[à tel moment]<hr/>complément de temps'; break
      case 'AF': traduction = '[de telle manière]<hr/>complément de manière'; break
      case 'AP': traduction = '[adverbe]<hr/>appliqué directement au verbe précédent'; break
      case 'VG': traduction = '","<hr/>(simple virgule)'; break
      case 'VN': traduction = "[action (verbe intransitif)]<hr/>verbe n'ayant pas de complément d'objet"; break
      case 'VT': traduction = "[action (verbe transitif)]<hr/>verbe d'action portant sur l'objet qui suit"; break
      case 'VM': traduction = '[action (modal)]<hr/>soit un auxiliaire, soit un verbe modifiant le verbe suivant'; break
      case 'VA': traduction = "[action (+ \"à\" + verbe)]<hr/>verbe appelant une construction avec \"à\" suivi d'un verbe"; break
      case 'VD': traduction = "[action (+ \"de\" + verbe)]<hr/>verbe appelant une construction avec \"de\" suivi d'un verbe"; break
      case 'VOI': traduction = "[action (+ objet + \"à\" + cible)]<hr/>verbe d'action nécessitant un objet plus \"à\" et une cible"; break
      case 'VOA': traduction = "[action (+ \"à\" + objet)]<hr/>verbe appelant une construction avec \"à\" suivi d'un objet"; break
      case 'VOD': traduction = "[action (+ \"de\" + objet)]<hr/>verbe appelant une construction avec \"de\" suivi d'un objet"; break
      case 'VOS': traduction = "[action (+ \"sur\" + objet)]<hr/>verbe appelant une construction avec \"sur\" suivi d'un objet"; break
      case 'VAV': traduction = '[action (+ objet + "avec" + objet)]<hr/>verbe appelant une construction avec 2 objets reliés par "avec"'; break
      case 'VET': traduction = '[action (+ objet + "et" + objet)]<hr/>verbe appelant une construction avec 2 objets reliés par "et"'; break
      case 'VTL': traduction = "[action (>>> lieu)]<hr/>verbe de déplacement ou de situation (donc suivi d'un lieu)"; break
      case 'PR_T': traduction = "[2ème action (transitif)]<hr/>verbe d'action portant sur un objet (au participe présent)"; break
      case 'PR_N': traduction = "[2ème action (intransitif)]<hr/>verbe n'ayant pas de complément d'objet (au participe présent)"; break
      case 'QS': traduction = "[structure interrogative]<hr/>l'un des trois modes interrogatifs disponibles"; break
      case 'AI': traduction = '[adjectif interrogatif]<hr/>facultatif, il modifie le sens de la question'; break
      default: traduction = '"' + code.substr(1) + '"<hr/>(nécessaire à la construction)'
    }
    if (question) {
      traduction += '<hr/>Note : le pronom personnel sujet est inclus au groupe verbal (mode interrogatif)'
    }
    return traduction
  },

  lireStructure: function (saisie) {
    const format = /((GN|CO|CL|CT|VG|AP|AF|VT|VN|VOA|VOD|VOI|VTL|VAV|VET|VOS|VM|VA|VD|PR_N|PR_T|§(c'est|à|de|sur|et|avec|sans|pour|que))(,|$)){2,}/
    if (!format.test(saisie) || !(/GN/).test(saisie)) {
      alert('La structure saisie est inconforme. Veuillez vérifier sa syntaxe.\nCe paramètre sera ignoré lors de la génération.')
      return false
    }
    return saisie.split(',')
  },

  _LISTES_DU_GRIMOIRE_: function (bidon) { /* pour structurer la liste des functions dans NotePad++ */ },

  sujets: PseudoBDD.Grimoire.sujets,
  verbes: {
    transitifs: PseudoBDD.Grimoire.verbes.transitifs,
    intransitifs: PseudoBDD.Grimoire.verbes.intransitifs,
    modaux: {
      simples: PseudoBDD.Grimoire.verbes.modaux.simples,
      suivisDeDE: PseudoBDD.Grimoire.verbes.modaux.suivisDeDE,
      suivisDeA: PseudoBDD.Grimoire.verbes.modaux.suivisDeA
    },
    avecPreposition: {
      codCoi: PseudoBDD.Grimoire.verbes.avecPreposition.codCoi,
      a: PseudoBDD.Grimoire.verbes.avecPreposition.a,
      de: PseudoBDD.Grimoire.verbes.avecPreposition.de,
      sur: PseudoBDD.Grimoire.verbes.avecPreposition.sur,
      avec2obj: PseudoBDD.Grimoire.verbes.avecPreposition.avec2obj,
      et2obj: PseudoBDD.Grimoire.verbes.avecPreposition.et2obj,
      lieu: PseudoBDD.Grimoire.verbes.avecPreposition.lieu
    }
  },
  adjectifsInterrogatifs: ['pourquoi', 'en quel honneur', 'à quel titre', 'à quelle fin', 'en vertu de quel droit', 'mais pourquoi'],
  adjectifsInterrogatifsLieu: ['où', 'à quel endroit', 'en quel lieu', 'où donc', 'où diable', 'putain mais où', 'dans quel pays', 'dans quelle ville'],
  adjectifsInterrogatifsTemps: ['quand', 'à quel moment', 'à quelle occasion'],
  adjectifsInterrogatifsManiere: ['comment', 'de quelle manière', 'dans quelle mesure'],
  complements: {
    objDir: PseudoBDD.Grimoire.complements.objDir,
    temps: PseudoBDD.Grimoire.complements.temps,
    lieu: PseudoBDD.Grimoire.complements.lieu
  },
  adverbes: {
    postpose: PseudoBDD.Grimoire.adverbes.postpose,
    fin: PseudoBDD.Grimoire.adverbes.fin
  },
  ponctuation: {
    virgule: [','],
    deuxPoints: [':'],
    pointVirgule: [';'],
    pointFinal: ['.', ' !', '...', ' ?']
  },
  negations: ['pas', 'plus', 'pas encore', 'presque plus', 'point', 'guère', 'jamais', 'presque jamais', 'plus jamais', 'pas du tout', 'pas vraiment'],
  PROBA_NEGATIONS: [12, 3, 2, 1, 1, 1, 2, 1, 1, 1, 1],
  PROBA_ADJECTIFS_INTERROGATIFS: [10, 1, 1, 1, 1, 1],
  PROBA_ADJECTIFS_INTERROGATIFS_LIEU: [8, 2, 1, 2, 2, 1, 1, 1],
  PROBA_ADJECTIFS_INTERROGATIFS_TEMPS: [10, 2, 1],
  PROBA_ADJECTIFS_INTERROGATIFS_MANIERE: [10, 2, 2],
  pronomsReflexifs: ['me', 'te', 'se', 'nous', 'vous', 'se'],

  // --- METHODES "PUBLIQUES" ---
  recupererMot: function (code) {
    if ((code === 'CT') && (de(6) > 5)) return ((de(3) > 1) ? Generateur.date() : Generateur.annee())
    const liste = Grimoire.recupererListe(code)
    return liste.puiser()
  },

  recupererListe: function (code) {
    switch (code) {
      case 'ST': return Grimoire.listerStructures()
      case 'GN': return PseudoBDD.Grimoire.sujets
      case 'VT': case 'PR_T': return PseudoBDD.Grimoire.verbes.transitifs
      case 'VN': case 'PR_N': return PseudoBDD.Grimoire.verbes.intransitifs
      case 'VM': return PseudoBDD.Grimoire.verbes.modaux.simples
      case 'VD': return PseudoBDD.Grimoire.verbes.modaux.suivisDeDE
      case 'VA': return PseudoBDD.Grimoire.verbes.modaux.suivisDeA
      case 'VOA': return PseudoBDD.Grimoire.verbes.avecPreposition.a
      case 'VOD': return PseudoBDD.Grimoire.verbes.avecPreposition.de
      case 'VOI': return PseudoBDD.Grimoire.verbes.avecPreposition.codCoi
      case 'VTL': return PseudoBDD.Grimoire.verbes.avecPreposition.lieu
      case 'VAV': return PseudoBDD.Grimoire.verbes.avecPreposition.avec2obj
      case 'VET': return PseudoBDD.Grimoire.verbes.avecPreposition.et2obj
      case 'VOS': return PseudoBDD.Grimoire.verbes.avecPreposition.sur
      case 'CO': return PseudoBDD.Grimoire.complements.objDir
      case 'CL': return PseudoBDD.Grimoire.complements.lieu
      case 'CT': return PseudoBDD.Grimoire.complements.temps
      case 'AP': return PseudoBDD.Grimoire.adverbes.postpose
      case 'AF': return PseudoBDD.Grimoire.adverbes.fin
      case 'VG': return Grimoire.ponctuation.virgule
      case '2P': return Grimoire.ponctuation.deuxPoints
      case 'PV': return Grimoire.ponctuation.pointVirgule
      case 'PF': return Grimoire.ponctuation.pointFinal
      case 'NG': return Grimoire.negations
    }
  },

  conjuguer: function (verbe, temps, pers, questionInv, genreSujet) {
    let formes = []
    let prefixe = ''
    const pronominal = (/^s('|e )/).test(verbe)
    if (pronominal) {
      verbe = verbe.replace(/^s('|e )(.*)/, '$2')
    }

    let personne = pers

    let persParticipe = 0
    if (type(personne) === 'array') {
      persParticipe = personne[1]
      personne = personne[0]
    }

    const posGroupe = verbe.indexOf('#')
    if (posGroupe > -1) { // groupes réguliers
      const groupe = parseInt(verbe.substr(posGroupe + 1), 10)
      let racine; let terminaisons; let inter = ''
      let posEaigu
      let posEfaible
      switch (groupe) {
        case 1:// verbes #1 : (modèle: chanter)
          racine = verbe.substr(0, verbe.lastIndexOf('er'))
          terminaisons = [
            ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
            ['e', 'es', 'e', 'ons', 'ez', 'ent'],
            ['erai', 'eras', 'era', 'erons', 'erez', 'eront'],
            ['é', 'ant']
          ]
          break
        case 2:// verbes #2 : (modèle: finir)
          racine = verbe.substr(0, verbe.lastIndexOf('ir'))
          terminaisons = [
            ['issais', 'issais', 'issait', 'issions', 'issiez', 'issaient'],
            ['is', 'is', 'it', 'issons', 'issez', 'issent'],
            ['irai', 'iras', 'ira', 'irons', 'irez', 'iront'],
            ['i', 'issant']
          ]
          break
        case 3:// verbes #3 : (modèle: sentir)
          racine = verbe.substr(0, verbe.lastIndexOf('tir'))
          terminaisons = [
            ['tais', 'tais', 'tait', 'tions', 'tiez', 'taient'],
            ['s', 's', 't', 'tons', 'tez', 'tent'],
            ['tirai', 'tiras', 'tira', 'tirons', 'tirez', 'tiront'],
            ['ti', 'tant']
          ]
          break
        case 4:// verbes #4 : (modèle: vendre/répondre)
          racine = verbe.substr(0, verbe.lastIndexOf('re'))
          terminaisons = [
            ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
            ['s', 's', '', 'ons', 'ez', 'ent'],
            ['rai', 'ras', 'ra', 'rons', 'rez', 'ront'],
            ['u', 'ant']
          ]
          break
        case 5:// verbes #5 : (modèle: paraître)
          racine = verbe.substr(0, verbe.lastIndexOf('aître'))
          terminaisons = [
            ['aissais', 'aissais', 'aissait', 'aissions', 'aissiez', 'aissaient'],
            ['ais', 'ais', 'aît', 'aissons', 'aissez', 'aissent'],
            ['aîtrai', 'aîtras', 'aîtra', 'aîtrons', 'aîtrez', 'aîtront'],
            ['u', 'aissant']
          ]
          break
        case 6:// verbes #6 : (modèle: construire)
          racine = verbe.substr(0, verbe.lastIndexOf('re'))
          terminaisons = [
            ['sais', 'sais', 'sait', 'sions', 'siez', 'saient'],
            ['s', 's', 't', 'sons', 'sez', 'sent'],
            ['rai', 'ras', 'ra', 'rons', 'rez', 'ront'],
            ['t', 'sant']
          ]
          break
        case 7:// verbes #7 : (modèle: peindre/joindre/craindre)
          racine = verbe.substr(0, verbe.lastIndexOf('ndre'))
          terminaisons = [
            ['gnais', 'gnais', 'gnait', 'gnions', 'gniez', 'gnaient'],
            ['ns', 'ns', 'nt', 'gnons', 'gnez', 'gnent'],
            ['ndrai', 'ndras', 'ndra', 'ndrons', 'ndrez', 'ndront'],
            ['nt', 'gnant']
          ]
          break
        case 8:// verbes #8 : (modèle: tenir)
          racine = verbe.substr(0, verbe.lastIndexOf('enir'))
          terminaisons = [
            ['enais', 'enais', 'enait', 'enions', 'eniez', 'enaient'],
            ['iens', 'iens', 'ient', 'enons', 'enez', 'iennent'],
            ['iendrai', 'iendras', 'iendra', 'iendrons', 'iendrez', 'iendront'],
            ['enu', 'enant']
          ]
          break
        case 9:// verbes #9 : (modèle: placer)
          racine = verbe.substr(0, verbe.lastIndexOf('cer'))
          terminaisons = [
            ['çais', 'çais', 'çait', 'cions', 'ciez', 'çaient'],
            ['ce', 'ces', 'ce', 'çons', 'cez', 'cent'],
            ['cerai', 'ceras', 'cera', 'cerons', 'cerez', 'ceront'],
            ['cé', 'çant']
          ]
          break
        case 10:// verbes #10 : (modèle: manger)
          racine = verbe.substr(0, verbe.lastIndexOf('er'))
          terminaisons = [
            ['eais', 'eais', 'eait', 'ions', 'iez', 'eaient'],
            ['e', 'es', 'e', 'eons', 'ez', 'ent'],
            ['erai', 'eras', 'era', 'erons', 'erez', 'eront'],
            ['é', 'eant']
          ]
          break
        case 11:// verbes #11 : (modèle: récupérer/accéder)
          posEaigu = verbe.lastIndexOf('é')
          racine = verbe.substr(0, posEaigu)
          inter = verbe.replace(/^(.*)é([^é]*)er#11$/, '$2')
          terminaisons = [
            ['é_ais', 'é_ais', 'é_ait', 'é_ions', 'é_iez', 'é_aient'],
            ['è_e', 'è_es', 'è_e', 'é_ons', 'é_ez', 'è_ent'],
            ['é_erai', 'é_eras', 'é_era', 'é_erons', 'é_erez', 'é_eront'],
            ['é_é', 'é_ant']
          ]
          break
        case 12:// verbes #12 : (modèle: mener/lever/peser)
          posEfaible = verbe.lastIndexOf('e')
          posEfaible = verbe.substr(0, posEfaible).lastIndexOf('e')
          racine = verbe.substr(0, posEfaible)
          inter = verbe.replace(/^(.*)e([^e]*)er#12$/, '$2')
          terminaisons = [
            ['e_ais', 'e_ais', 'e_ait', 'e_ions', 'e_iez', 'e_aient'],
            ['è_e', 'è_es', 'è_e', 'e_ons', 'e_ez', 'è_ent'],
            ['è_erai', 'è_eras', 'è_era', 'è_erons', 'è_erez', 'è_eront'],
            ['e_é', 'e_ant']
          ]
          break
        case 13:// verbes #13 : (modèle: prendre)
          racine = verbe.substr(0, verbe.lastIndexOf('endre'))
          terminaisons = [
            ['enais', 'enais', 'enait', 'enions', 'eniez', 'enaient'],
            ['ends', 'ends', 'end', 'enons', 'enez', 'ennent'],
            ['endrai', 'endras', 'endra', 'endrons', 'endrez', 'endront'],
            ['is', 'enant']
          ]
          break
        case 14:// verbes #14 : (modèle: mettre)
          racine = verbe.substr(0, verbe.lastIndexOf('ettre'))
          terminaisons = [
            ['ettais', 'ettais', 'ettait', 'ettions', 'ettiez', 'ettaient'],
            ['ets', 'ets', 'et', 'ettons', 'ettez', 'ettent'],
            ['ettrai', 'ettras', 'ettra', 'ettrons', 'ettrez', 'ettront'],
            ['is', 'ettant']
          ]
          break
        case 15:// verbes #15 : (modèle: essuyer/employer)
          racine = verbe.substr(0, verbe.lastIndexOf('yer'))
          terminaisons = [
            ['yais', 'yais', 'yait', 'yions', 'yiez', 'yaient'],
            ['ie', 'ies', 'ie', 'yons', 'yez', 'ient'],
            ['ierai', 'ieras', 'iera', 'ierons', 'ierez', 'ieront'],
            ['yé', 'yant']
          ]
          break
        case 16:// verbes #16 : (modèle: ouvrir)
          racine = verbe.substr(0, verbe.lastIndexOf('rir'))
          terminaisons = [
            ['rais', 'rais', 'rait', 'rions', 'riez', 'raient'],
            ['re', 'res', 're', 'rons', 'rez', 'rent'],
            ['rirai', 'riras', 'rira', 'rirons', 'rirez', 'riront'],
            ['ert', 'rant']
          ]
          break
        case 17:// verbes #17 : (modèle: battre)
          racine = verbe.substr(0, verbe.lastIndexOf('tre'))
          terminaisons = [
            ['tais', 'tais', 'tait', 'tions', 'tiez', 'taient'],
            ['s', 's', '', 'tons', 'tez', 'tent'],
            ['trai', 'tras', 'tra', 'trons', 'trez', 'tront'],
            ['tu', 'tant']
          ]
          break
        case 18:// verbes #18 : (modèle: écrire)
          racine = verbe.substr(0, verbe.lastIndexOf('re'))
          terminaisons = [
            ['vais', 'vais', 'vait', 'vions', 'viez', 'vaient'],
            ['s', 's', 't', 'vons', 'vez', 'vent'],
            ['rai', 'ras', 'ra', 'rons', 'rez', 'ront'],
            ['t', 'vant']
          ]
          break
        case 19:// verbes #19 : (modèle: servir)
          racine = verbe.substr(0, verbe.lastIndexOf('vir'))
          terminaisons = [
            ['vais', 'vais', 'vait', 'vions', 'viez', 'vaient'],
            ['s', 's', 't', 'vons', 'vez', 'vent'],
            ['virai', 'viras', 'vira', 'virons', 'virez', 'viront'],
            ['vi', 'vant']
          ]
          break
        case 20:// verbes #20 : (modèle: percevoir)
          racine = verbe.substr(0, verbe.lastIndexOf('cevoir'))
          terminaisons = [
            ['cevais', 'cevais', 'cevait', 'cevions', 'ceviez', 'cevaient'],
            ['çois', 'çois', 'çoit', 'cevons', 'cevez', 'çoivent'],
            ['cevrai', 'cevras', 'cevra', 'cevrons', 'cevrez', 'cevront'],
            ['çu', 'cevant']
          ]
          break
        case 21:// verbes #21 : (modèle: jeter)
          racine = verbe.substr(0, verbe.lastIndexOf('er'))
          terminaisons = [
            ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
            ['te', 'tes', 'te', 'ons', 'ez', 'tent'],
            ['terai', 'teras', 'tera', 'terons', 'terez', 'teront'],
            ['é', 'ant']
          ]
          break
        case 22:// verbes #22 : (modèle: vivre)
          racine = verbe.substr(0, verbe.lastIndexOf('ivre'))
          terminaisons = [
            ['ivais', 'ivais', 'ivait', 'ivions', 'iviez', 'ivaient'],
            ['is', 'is', 'it', 'ivons', 'ivez', 'ivent'],
            ['ivrai', 'ivras', 'ivra', 'ivrons', 'ivrez', 'ivront'],
            ['écu', 'vant']
          ]
          break
        case 23:// verbes #23 : (modèle: appeler)
          racine = verbe.substr(0, verbe.lastIndexOf('er'))
          terminaisons = [
            ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'],
            ['le', 'les', 'le', 'ons', 'ez', 'lent'],
            ['lerai', 'leras', 'lera', 'lerons', 'lerez', 'leront'],
            ['é', 'ant']
          ]
          break
      }

      let ligne, terminaison
      for (let t = 0; t < 4; ++t) {
        ligne = []
        for (let p = 0; p < 6; ++p) {
          terminaison = terminaisons[t][p] || ''
          if (inter.length > 0) {
            terminaison = terminaison.replace(/_/g, inter)
          }
          ligne.push(racine + terminaison)
        }
        formes.push(ligne)
      }
    } else { // conjugaisons irrégulières ou non encore catégorisées
      switch (verbe) {
        case 'être':
          formes = [
            ['étais', 'étais', 'était', 'étions', 'étiez', 'étaient'],
            ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
            ['serai', 'seras', 'sera', 'serons', 'serez', 'seront'],
            ['été', 'étant']
          ]
          break
        case 'avoir':
          formes = [
            ['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient'],
            ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
            ['aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront'],
            ['eu', 'ayant']
          ]
          break
        case 'aller':
          formes = [
            ['allais', 'allais', 'allait', 'allions', 'alliez', 'allaient'],
            ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
            ['irai', 'iras', 'ira', 'irons', 'irez', 'iront'],
            ['allé', 'allant']
          ]
          break
        case 'devoir':
          formes = [
            ['devais', 'devais', 'devait', 'devions', 'deviez', 'devaient'],
            ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'],
            ['devrai', 'devras', 'devra', 'devrons', 'devrez', 'devront'],
            ['du', 'devant']
          ]
          break
        case 'voir':
          formes = [
            ['voyais', 'voyais', 'voyait', 'voyions', 'voyiez', 'voyaient'],
            ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'],
            ['verrai', 'verras', 'verra', 'verrons', 'verrez', 'verront'],
            ['vu', 'voyant']
          ]
          break
        case 'savoir':
          formes = [
            ['savais', 'savais', 'savait', 'savions', 'saviez', 'savaient'],
            ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'],
            ['saurai', 'sauras', 'saura', 'saurons', 'saurez', 'sauront'],
            ['su', 'sachant']
          ]
          break
        case 'pouvoir':
          formes = [
            ['pouvais', 'pouvais', 'pouvait', 'pouvions', 'pouviez', 'pouvaient'],
            ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'],
            ['pourrai', 'pourras', 'pourra', 'pourrons', 'pourrez', 'pourront'],
            ['pu', 'pouvant']
          ]
          break
        case 'résoudre':
          formes = [
            ['résolvais', 'résolvais', 'résolvait', 'résolvions', 'résolviez', 'résolvaient'],
            ['résous', 'résous', 'résout', 'résolvons', 'résolvez', 'résolvent'],
            ['résoudrai', 'résoudras', 'résoudra', 'résoudrons', 'résoudrez', 'résoudront'],
            ['résolu', 'résolvant']
          ]
          break
        case 'mordre':
          formes = [
            ['mordais', 'mordais', 'mordait', 'mordions', 'mordiez', 'mordaient'],
            ['mords', 'mords', 'mord', 'mordons', 'mordez', 'mordent'],
            ['mordrai', 'mordras', 'mordra', 'mordrons', 'mordrez', 'mordront'],
            ['mordu', 'mordant']
          ]
          break
        case 'envoyer':
          formes = [
            ['envoyais', 'envoyais', 'envoyait', 'envoyions', 'envoyiez', 'envoyaient'],
            ['envoie', 'envoies', 'envoie', 'envoyons', 'envoyez', 'envoient'],
            ['enverrai', 'enverras', 'enverra', 'enverrons', 'enverrez', 'enverront'],
            ['envoyé', 'envoyant']
          ]
          break
        case 'faire':
          formes = [
            ['faisais', 'faisais', 'faisait', 'faisions', 'faisiez', 'faisaient'],
            ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'],
            ['ferai', 'feras', 'fera', 'ferons', 'ferez', 'feront'],
            ['fait', 'faisant']
          ]
          break
        case 'vouloir':
          formes = [
            ['voulais', 'voulais', 'voulait', 'voulions', 'vouliez', 'voulaient'],
            ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'],
            ['voudrai', 'voudras', 'voudra', 'voudrons', 'voudrez', 'voudront'],
            ['voulu', 'voulant']
          ]
          break
        case 'croire':
          formes = [
            ['croyais', 'croyais', 'croyait', 'croyions', 'croyiez', 'croyaient'],
            ['crois', 'crois', 'croit', 'croyons', 'croyez', 'croient'],
            ['croirai', 'croiras', 'croira', 'croirons', 'croirez', 'croiront'],
            ['cru', 'croyant']
          ]
          break
        case 'rire':
          formes = [
            ['riais', 'riais', 'riait', 'riions', 'riiez', 'riaient'],
            ['ris', 'ris', 'rit', 'rions', 'riez', 'rient'],
            ['rirai', 'riras', 'rira', 'rirons', 'rirez', 'riront'],
            ['ri', 'riant']
          ]
          break
        case 'lire':
          formes = [
            ['lisais', 'lisais', 'lisait', 'lisions', 'lisiez', 'lisaient'],
            ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'],
            ['lirai', 'liras', 'lira', 'lirons', 'lirez', 'liront'],
            ['lu', 'lisant']
          ]
          break
        case 'dire':
          formes = [
            ['disais', 'disais', 'disait', 'disions', 'disiez', 'disaient'],
            ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'],
            ['dirai', 'diras', 'dira', 'dirons', 'direz', 'diront'],
            ['dit', 'disant']
          ]
          break
        case 'interdire':
          formes = [
            ['interdisais', 'interdisais', 'interdisait', 'interdisions', 'interdisiez', 'interdisaient'],
            ['interdis', 'interdis', 'interdit', 'interdisons', 'interdisez', 'interdisent'],
            ['interdirai', 'interdiras', 'interdira', 'interdirons', 'interdirez', 'interdiront'],
            ['interdit', 'interdisant']
          ]
          break
        case 'suivre':
          formes = [
            ['suivais', 'suivais', 'suivait', 'suivions', 'suiviez', 'suivaient'],
            ['suis', 'suis', 'suit', 'suivons', 'suivez', 'suivent'],
            ['suivrai', 'suivras', 'suivra', 'suivrons', 'suivrez', 'suivront'],
            ['suivi', 'suivant']
          ]
          break
        case 'perdre':
          formes = [
            ['perdais', 'perdais', 'perdait', 'perdions', 'perdiez', 'perdaient'],
            ['perds', 'perds', 'perd', 'perdons', 'perdez', 'perdent'],
            ['perdrai', 'perdras', 'perdra', 'perdrons', 'perdrez', 'perdront'],
            ['perdu', 'perdant']
          ]
          break
        case 'dormir':
          formes = [
            ['dormais', 'dormais', 'dormait', 'dormions', 'dormiez', 'dormaient'],
            ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'],
            ['dormirai', 'dormiras', 'dormira', 'dormirons', 'dormirez', 'dormiront'],
            ['dormi', 'dormant']
          ]
          break
        case 'courir':
          formes = [
            ['courais', 'courais', 'courait', 'courions', 'couriez', 'couraient'],
            ['cours', 'cours', 'court', 'courons', 'courez', 'courent'],
            ['courrai', 'courras', 'courra', 'courrons', 'courrez', 'courront'],
            ['couru', 'courant']
          ]
          break
        case 'recourir':
          formes = [
            ['recourais', 'recourais', 'recourait', 'recourions', 'recouriez', 'recouraient'],
            ['recours', 'recours', 'recourt', 'recourons', 'recourez', 'recourent'],
            ['recourrai', 'recourras', 'recourra', 'recourrons', 'recourrez', 'recourront'],
            ['recouru', 'recourant']
          ]
          break
        case 'mourir':
          formes = [
            ['mourais', 'mourais', 'mourait', 'mourions', 'mouriez', 'mouraient'],
            ['meurs', 'meurs', 'meurt', 'mourons', 'mourez', 'meurent'],
            ['mourrai', 'mourras', 'mourra', 'mourrons', 'mourrez', 'mourront'],
            ['mort', 'mourant']
          ]
          break
        case 'plaire':
          formes = [
            ['plaisais', 'plaisais', 'plaisait', 'plaisions', 'plaisiez', 'plaisaient'],
            ['plais', 'plais', 'plaît', 'plaisons', 'plaisez', 'plaisent'],
            ['plairai', 'plairas', 'plaira', 'plairons', 'plairez', 'plairont'],
            ['plu', 'plaisant']
          ]
          break
        case 'nuire':
          formes = [
            ['nuisais', 'nuisais', 'nuisait', 'nuisions', 'nuisiez', 'nuisaient'],
            ['nuis', 'nuis', 'nuit', 'nuisons', 'nuisez', 'nuisent'],
            ['nuirai', 'nuiras', 'nuira', 'nuirons', 'nuirez', 'nuiront'],
            ['nui', 'nuisant']
          ]
          break
        case 'fuir':
          formes = [
            ['fuyais', 'fuyais', 'fuyait', 'fuyions', 'fuyiez', 'fuyaient'],
            ['fuis', 'fuis', 'fuit', 'fuyons', 'fuyez', 'fuient'],
            ['fuirai', 'fuiras', 'fuira', 'fuirons', 'fuirez', 'fuiront'],
            ['fui', 'fuyant']
          ]
          break
        case 'enfuir':
          formes = [
            ['enfuyais', 'enfuyais', 'enfuyait', 'enfuyions', 'enfuyiez', 'enfuyaient'],
            ['enfuis', 'enfuis', 'enfuit', 'enfuyons', 'enfuyez', 'enfuient'],
            ['enfuirai', 'enfuiras', 'enfuira', 'enfuirons', 'enfuirez', 'enfuiront'],
            ['enfui', 'enfuyant']
          ]
          break
        case '£aïr':
          formes = [
            ['£aïssais', '£aïssais', '£aïssait', '£aïssions', '£aïssiez', '£aïssaient'],
            ['£ais', '£ais', '£ait', '£aïssons', '£aïssez', '£aïssent'],
            ['£aïrai', '£aïras', '£aïra', '£aïrons', '£aïrez', '£aïront'],
            ['£aï', '£aïssant']
          ]
          break
      }
    }

    let retour = formes[temps - 1][personne - 1]
    let abbrev = false
    if (pronominal) {
      prefixe = Grimoire.pronomsReflexifs[(persParticipe > 0) ? (persParticipe - 1) : (personne - 1)] + ' '
      if (retour.voyelle() && (prefixe.indexOf('e') > -1)) {
        abbrev = true
      }
    }
    retour = prefixe + retour
    if (abbrev) {
      retour = retour.replace(/e /, "'")
    }
    if (questionInv) {
      let particule = Generateur.GN.pronomsPers[personne - 1].split('@')[0]
      if (particule.indexOf('_') > -1) {
        particule = particule.split('_')[(genreSujet === 'F' ? 1 : 0)]
      }
      const t = ((personne % 3 === 0) && (retour.charAt(retour.length - 1) !== 't')) ? 't-' : ''
      retour += '-' + t + particule
      retour = retour.replace(/e-je/, 'é-je').replace(/oié-je/, 'oie-je')
    }
    return retour
  }
}

const Generateur = {

  Memoire: {
    modeInterrogatif: 'libre',
    generations: 0,
    tentatives: 0,
    nbAlertesLongueur: 0,
    precedenteStructure: null,
    longueurAuChoix: [null, null],
    longueurFixe: false,
    sujetAuChoix: null,
    sansPronoms: false,
    genListes: false // chargement des listes seulement sur ouverture de la div
  },

  Articles: {
    articlesDef: ['le*_la*', 'les'],
    articlesIndef: ['un_une', 'des'],
    // articlesParti: ["du", "de la"],
    articlesDemo: ['ce¤_cette', 'ces'],
    articlesPossS: ['mon_ma', 'ton_ta', 'son_sa', 'notre', 'votre', 'leur'],
    articlesPossP: ['mes', 'tes', 'ses', 'nos', 'vos', 'leurs'],
    quantifieurs: PseudoBDD.Generateur.Articles.quantifieurs,
    PROBA_QUANTIFIEURS: [4, 4, 3, 5, 6, 6, 7, 6, 5, 4, 4, 3, 3, 4, 4, 3, 3, 2, 3, 2, 2, 2, 4, 2, 3, 2, 1, 1, 1, 2, 1, 1, 1]
  },

  GN: {
    PROBA_PRONOMS_PERS: [2, 2, 1, 2, 2, 1],
    nomsCommuns: PseudoBDD.Generateur.GN.nomsCommuns,
    complementNomPost: PseudoBDD.Generateur.GN.complementNomPost,
    pronomsPers: ['je@1', 'tu@2', 'il_elle@3', 'nous@4', 'vous@5', 'ils_elles@6'],
    nomsPropres: PseudoBDD.Generateur.GN.nomsPropres,
    variantesNP: PseudoBDD.Generateur.GN.variantesNP,
    compter: function () {
      let resultat = 0
      const NOMBRE = 2

      let articles = 3// définis, indéfinis et démonstratifs : une seule possibilité pour chaque (cause règles accord)
      const nombres = 1090// nombres de nombres possibles comme article (tous ceux de 2 à 1000, puis de 100 en 100 jusqu'à 10000)
      const quantifieurs = Generateur.Articles.quantifieurs.length + 99// pour le cas du pourcentage (%%)
      articles += nombres + quantifieurs

      let complements = Generateur.GN.complementNomPost.length + 1
      let jokersC = 0
      for (let i = 0, iMax = Generateur.GN.complementNomPost.length; i < iMax; ++i) {
        const compl = Generateur.GN.complementNomPost[i]
        for (let j = 0, jMax = compl.length; j < jMax; ++j) {
          if (compl.charAt(j) === '&') {
            ++jokersC
          }
        }
      }
      complements += (jokersC * 100)

      // noms communs
      for (let i = 0, iMax = Generateur.GN.nomsCommuns.length; i < iMax; ++i) {
        const nom = Generateur.GN.nomsCommuns[i]
        const genre = ((/[%N]/).test(nom)) ? 2 : 1

        resultat += (genre * NOMBRE * articles * complements)
      }

      // pronoms personnels
      resultat += 6

      // noms propres simples
      const totalNP = Generateur.GN.nomsPropres.length
      resultat += totalNP

      // variantes des noms propres
      let jokers = 0
      for (let i = 0, iMax = Generateur.GN.variantesNP.length; i < iMax; ++i) {
        const nomP = Generateur.GN.variantesNP[i]
        for (let j = 0, jMax = nomP.length; j < jMax; ++j) {
          if (nomP.charAt(j) === '$') {
            ++jokers
          }
        }
      }
      resultat += (jokers * totalNP)

      return resultat
    }
  },

  groupeNominal: function (estObjet) {
    if (de(5) > 4) {
      if (de(2) > 1) {
        let variante
        let genreVariante = ''
        do {
          variante = Generateur.GN.variantesNP.puiser()
        }
        while (estObjet && (/ et (moi|toi|nous|vous)/).test(variante))
        if (variante.indexOf('__H') > -1) {
          variante = variante.replace(/__H/, '')
          genreVariante = 'H'
        } else if (variante.indexOf('__F') > -1) {
          variante = variante.replace(/__F/, '')
          genreVariante = 'F'
        }
        let posDollar = variante.indexOf('$')
        while (posDollar > -1) {
          const chercheF = variante.charAt(posDollar + 1) === 'F'
          const chercheM = variante.charAt(posDollar + 1) === 'M'
          let nomP
          let fem
          do {
            do {
              nomP = Generateur.GN.nomsPropres.puiser()
              fem = nomP.indexOf('_F') > -1
            }
            while ((chercheM && fem) || (chercheF && !fem))
            nomP = nomP.replace(/_F/, '')
          }
          while (variante.indexOf(nomP) > -1)
          if ((genreVariante === '') && (!fem)) {
            genreVariante = 'H'
          }
          variante = variante.replace(/\$[FM]?/, nomP)
          posDollar = variante.indexOf('$')
        }
        if (genreVariante !== 'H') variante += '__F'
        variante = variante.replace(/(certain(e)? ")(le |la |l')(.*)/, '$1$4')
        return variante.replace(/ (d|qu)e ([aeiouhéêèâyœ])/gi, " $1'$2")
      }
      return Generateur.GN.nomsPropres.puiser().replace(/_F/, '__F') + '@3'
    }
    let pronomP
    if ((!Generateur.Memoire.sansPronoms) && (!estObjet && (de(10) > 7))) {
      pronomP = probaSwitch(Generateur.GN.pronomsPers, Generateur.GN.PROBA_PRONOMS_PERS)
      if (pronomP.indexOf('_') === -1) {
        return pronomP + '_PP'
      }
      const personne = pronomP.split('@')[1]
      pronomP = pronomP.split('@')[0].split('_')
      pronomP[1] += '__F'
      return pronomP[(de(2) - 1)] + '@' + personne + '_PP'
    }

    // --- noms communs ---
    let nom = Generateur.GN.nomsCommuns.puiser()
    if (nom.indexOf('%') > -1) {
      nom = nom.split('%')
      if (nom[1].length === 1) {
        nom[1] = nom[0].replace(/².*$/, '') + nom[1]
      }
      nom[0] += '_H'
      nom[1] += '_F'
      nom = nom.puiser()
    }
    nom = nom.split('_')
    if ((nom[1] === 'N') && (de(2) > 1)) {
      nom[1] = 'F'
    }

    const feminin = (nom[1] === 'F')
    nom = nom[0]
    let pluriel = (de(2) === 1)
    const voyelle = nom.voyelle()

    let article; const jetArticle = de(100)
    if (jetArticle < 38) { // définis
      article = Generateur.Articles.articlesDef[(pluriel) ? 1 : 0]
    } else if (jetArticle < 78) { // indéfinis
      article = Generateur.Articles.articlesIndef[(pluriel) ? 1 : 0]
    } else if (jetArticle < 84) { // démonstratifs
      article = Generateur.Articles.articlesDemo[(pluriel) ? 1 : 0]
    } else if (jetArticle < 96) { // quantifieurs
      article = probaSwitch(Generateur.Articles.quantifieurs, Generateur.Articles.PROBA_QUANTIFIEURS)
      pluriel = article.indexOf('µ') === -1
      if (article.indexOf('%%') > -1) {
        article = article.replace(/%%/, de(100).enLettres())
      }
    } else { // nombres entiers
      const nombre = deProgressif1()
      article = nombre.enLettres()
      if (feminin) {
        article = article.replace(/un$/, 'une')
      }
      pluriel = true
    }

    if (article.indexOf('_') > -1) {
      article = article.split('_')[(feminin) ? 1 : 0]
    }

    const plurielNom = (article.indexOf('µ') > -1) ? true : pluriel
    article = article.replace(/µ/, '')
    nom = Generateur.accordPluriel(nom, plurielNom)

    let complement = ''
    if (de(4) > 3) {
      complement = Generateur.GN.complementNomPost.puiser()
      if (complement.indexOf('%') > -1) {
        complement = complement.split('%')
        if (complement[1].length === 1) {
          complement[1] = complement[0] + complement[1]
        }
        complement = complement[(feminin) ? 1 : 0]
      }
      complement = ' ' + Generateur.accordPluriel(complement, plurielNom)
      let nombre
      while (complement.indexOf('&') > -1) {
        nombre = (de(100) + 1).enLettres()
        if (feminin && (/un$/.test(nombre))) {
          nombre += 'e'
        }
        complement = complement.replace(/&/, nombre)
      }
    }

    let groupeN = article + ' ' + nom + complement
    if (voyelle) {
      groupeN = groupeN.replace(/.\* /, "'").replace(/¤/, 't')
    }
    groupeN = groupeN.replace(/[*¤]/g, '')
    let codePers = ''
    if (!estObjet) {
      codePers = '@' + ((pluriel) ? '6' : '3')
    }
    return groupeN + codePers + (feminin ? '__F' : '')
  },

  CO: {
    nomsCommuns: PseudoBDD.Generateur.CO.nomsCommuns,
    adjectifsPost: PseudoBDD.Generateur.CO.adjectifsPost,
    adjectifsPre: PseudoBDD.Generateur.CO.adjectifsPre,
    // modificateurs: ["tres", "assez", "trop", "peu"], // chaud a priori ^^'
    // piste : indice en premier caractère genre * et remplacement par un aléatoire de temps en temps
    // >>> uniquement les adjectifs qui se prêtent à une gradation : ex: "très beau" > OK ; "très premier" > NOT OK
    compter: function () {
      let resultat = 0
      const NOMBRE = 2
      let articles = 3// définis, indéfinis et démonstratifs : une seule possibilité pour chaque (cause règles accord)
      articles += 5// 1 possessif par personne, -1 cas rejeté
      const nombres = 1090// nombres de nombres possibles comme article (tous ceux de 2 à 1000, puis de 100 en 100 jusqu'à 10000)
      const quantifieurs = Generateur.Articles.quantifieurs.length + 99// pour le cas du pourcentage (%%)
      articles += nombres + quantifieurs

      let adjPost = Generateur.CO.adjectifsPost.length
      let jokers = 0
      for (let i = 0, iMax = adjPost; i < iMax; ++i) {
        const adj = Generateur.CO.adjectifsPost[i]
        for (let j = 0, jMax = adj.length; j < jMax; ++j) {
          if (adj.charAt(j) === '&') {
            ++jokers
          }
        }
      }
      adjPost += (jokers * nombres)

      const adjPre = Generateur.CO.adjectifsPre.length
      const adjectifs = (adjPost + adjPre + 1)// +1 pour l'absence d'adjectif

      for (let i = 0, iMax = Generateur.CO.nomsCommuns.length; i < iMax; ++i) {
        const nom = Generateur.CO.nomsCommuns[i]
        const genre = (/[%N]/).test(nom) ? 2 : 1

        resultat += (genre * NOMBRE * articles * adjectifs)
      }

      return resultat
    }
  },

  complementObjet: function (personneSujet) {
    let cObj; let nom = Generateur.CO.nomsCommuns.puiser()
    let indef = false
    nom = nom.split('_')
    if ((nom[1] === 'N') && (de(2) > 1)) {
      nom[1] = 'F'
    }

    const feminin = nom[1] === 'F'
    nom = nom[0]
    let pluriel = de(2) === 1
    const voyelle = nom.voyelle()

    let adjectif = ''
    let prePose = false
    const jetAdj = de(100)
    if (jetAdj < 20) {
      adjectif = Generateur.CO.adjectifsPost.puiser()
    } else if (jetAdj < 24) {
      adjectif = Generateur.CO.adjectifsPre.puiser()
      prePose = true
    }
    const noAdj = adjectif.length === 0

    while (adjectif.indexOf('&') > -1) {
      let nombre = deProgressif1()
      nombre = nombre.enLettres()
      adjectif = adjectif.replace(/&/, nombre)
    }

    if (!noAdj && (adjectif.indexOf('%') > -1)) {
      adjectif = adjectif.split('%')
      if (adjectif[1].length === 1) {
        adjectif[1] = adjectif[0] + adjectif[1]
      }
      adjectif = adjectif[(feminin) ? 1 : 0]
    }

    let voyelleAdj = false
    if (!noAdj) {
      voyelleAdj = adjectif.voyelle()
    }

    let article; const jetArticle = de(100)
    if (jetArticle < 35) { // définis
      article = Generateur.Articles.articlesDef[(pluriel) ? 1 : 0]
    } else if (jetArticle < 70) { // indéfinis
      article = Generateur.Articles.articlesIndef[(pluriel) ? 1 : 0]
      indef = true
    } else if (jetArticle < 78) { // démonstratifs
      article = Generateur.Articles.articlesDemo[(pluriel) ? 1 : 0]
    } else if (jetArticle < 90) { // quantifieurs
      article = probaSwitch(Generateur.Articles.quantifieurs, Generateur.Articles.PROBA_QUANTIFIEURS)
      article = article.replace(/µ/, '')
      pluriel = true
      if (article.indexOf('%%') > -1) {
        article = article.replace(/%%/, de(100).enLettres())
      }
    } else if (jetArticle < 94) { // nombres entiers
      const nombre = deProgressif1()
      article = nombre.enLettres()
      if (feminin) {
        article = article.replace(/un$/, 'une')
      }
      pluriel = true
    } else { // possessifs
      let personne = 0
      while (personne === 0) {
        personne = de(6)
        if (Math.abs(personneSujet - personne) === 3) {
          personne = 0
        }
      }
      article = (pluriel) ? Generateur.Articles.articlesPossP[personne - 1] : Generateur.Articles.articlesPossS[personne - 1]
      if (article.indexOf('_') > -1) {
        let articleFeminin = feminin
        if ((voyelle && articleFeminin) || (prePose && voyelleAdj)) {
          if (noAdj || (!noAdj && !prePose) || (prePose && voyelleAdj)) {
            articleFeminin = false
          }
        }
        article = article.split('_')[(articleFeminin) ? 1 : 0]
      }
    }
    if (article.indexOf('_') > -1) {
      article = article.split('_')[(feminin) ? 1 : 0]
    }

    nom = Generateur.accordPluriel(nom, pluriel)
    adjectif = Generateur.accordPluriel(adjectif, pluriel)

    if (prePose && (adjectif.indexOf('°') > -1)) {
      adjectif = adjectif.split('°')[(voyelle) ? 1 : 0]
    }

    if (indef && pluriel && prePose) {
      article = (voyelleAdj) ? "d'" : 'de'
    }

    if ((voyelle && noAdj) || (voyelle && !noAdj && !prePose) || (!noAdj && prePose && voyelleAdj)) {
      article = article.replace(/.\* /, "'").replace(/¤/, 't')
    }

    if (noAdj) {
      cObj = article + ' ' + nom
    } else {
      cObj = article
      if (!noAdj && prePose) {
        cObj += (article.indexOf("'") === -1) ? (' ' + adjectif) : adjectif
      }
      cObj += ' ' + nom
      if (!noAdj && !prePose) {
        cObj += ' ' + adjectif
      }
    }

    if ((voyelle && noAdj) || (voyelle && !noAdj && !prePose) || (!noAdj && prePose && voyelleAdj)) {
      cObj = cObj.replace(/.\* /, "'").replace(/¤/, 't')
    }
    cObj = cObj.replace(/[*¤]/g, '')
    return cObj
  },

  accordPluriel: function (mot, pluriel) {
    let retour = mot
    if (pluriel) {
      if (retour.indexOf('²') === -1) {
        retour += 's'
      } else {
        if (retour.indexOf('²²') === -1) {
          retour = retour.replace(/²([^\s])/g, '$1').replace(/²/g, '')
        } else {
          retour = retour.split('²²')[1]
        }
      }
    } else {
      if (retour.indexOf('²²') > -1) {
        retour = retour.split('²²')[0]
      }
      retour = retour.replace(/²./g, '').replace(/²/g, '')
    }
    return retour
  },

  stats: function () {
    const tabResultat = []
    const statsGN = Generateur.GN.compter()
    const statsCO = Generateur.CO.compter()

    const listeST = Grimoire.recupererListe('ST')
    for (let i = 0, iMax = listeST.length; i < iMax; ++i) {
      let resultatStructure = 1
      const struct = listeST[i]

      for (let j = 0, jMax = struct.length; j < jMax; ++j) {
        let resultatBloc = 0
        const bloc = struct[j]

        if (bloc.substr(0, 1) === '§') {
          resultatBloc = 1
        } else {
          let nbAlea
          let jokers
          let jokersPlus
          let liste
          switch (bloc) {
            case 'GN':
              resultatBloc += statsGN
              resultatBloc += Grimoire.recupererListe(bloc).length
              break
            case 'CO':
              resultatBloc += statsCO
              resultatBloc += Grimoire.recupererListe(bloc).length
              break
            case 'CT':
              jokers = 0
              liste = Grimoire.recupererListe(bloc)
              for (let k = 0, kMax = liste.length; k < kMax; ++k) {
                const elem = liste[k]
                resultatBloc += 3
                for (let l = 0, lMax = elem.length; l < lMax; ++l) {
                  if (elem.charAt(l) === '$') {
                    ++jokers
                  }
                  if (elem.charAt(l) === '¤') {
                    resultatBloc -= 2
                  }
                }
                ++resultatBloc
              }
              resultatBloc += (jokers * Generateur.GN.nomsPropres.length)
              // pour dates aléatoires
              nbAlea = new Date() / (1000 * 60 * 60 * 24)// valeur en jours de la fourchette courante
              nbAlea *= 11// fourchette de la génération de Date.random()
              resultatBloc += (nbAlea * 2)// pour l'affichage (ou non) du nom du jour, exemple : "le (dimanche) 2 janvier 2011"
              resultatBloc += 4000// pour les dates de Generateur.annee()
              break
            case 'CL':
            case 'AF':
              jokers = 0
              jokersPlus = 0
              liste = Grimoire.recupererListe(bloc)
              for (let k = 0, kMax = liste.length; k < kMax; ++k) {
                const elem = liste[k]
                for (let l = 0, lMax = elem.length; l < lMax; ++l) {
                  if (elem.charAt(l) === '$') {
                    ++jokers
                  }
                  if (elem.charAt(l) === '+') {
                    ++jokersPlus
                  }
                }
                ++resultatBloc
              }
              resultatBloc += (jokers * Generateur.GN.nomsPropres.length)
              resultatBloc += Math.floor((jokersPlus * Generateur.GN.nomsCommuns.length) / 1.5)// approximation (on ne peut pas compter tous les noms communs car le genre doit correspondre)
              break
            case 'VT':
            case 'VN':
            case 'VM':
            case 'VD':
            case 'VA':
            case 'VOA':
            case 'VOD':
            case 'VOI':
            case 'VTL':
            case 'VAV':
            case 'VET':
            case 'VOS':
            case 'PR_T':
            case 'PR_N':
              resultatBloc += Grimoire.recupererListe(bloc).length * (Grimoire.recupererListe('NG').length + 1)
              break
            default:
              resultatBloc += Grimoire.recupererListe(bloc).length
          }
        }

        if ((bloc === 'CT') || (bloc === 'CL') || (bloc === 'AF')) {
          const liste = Grimoire.recupererListe(bloc)
          let jokers = 0
          const nombres = 9// voir implémentation en dur dans Phrase() (c.a.d. un dé de 10, moins 1 ici pour la possibilité déjà décomptée "normalement " dans le switch) ^^' re-misère
          for (let k = 0, kMax = liste.length; k < kMax; ++k) {
            const elem = liste[k]
            for (let l = 0, lMax = elem.length; l < lMax; ++l) {
              if (elem.charAt(l) === '&') {
                ++jokers
              }
            }
          }
          resultatBloc += (jokers * nombres)
        }
        resultatStructure *= resultatBloc
      }
      resultatStructure *= Grimoire.recupererListe('PF').length// types de ponctuation finale

      tabResultat.push(resultatStructure)
    }
    return tabResultat
  },

  Mots: {
    consonnes: ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z', 'cc', 'ff', 'll', 'mm', 'nn', 'pp', 'rr', 'ss', 'tt'],
    multiConsonnes: ['bl', 'br', 'ch', 'cl', 'cr', 'dj', 'dr', 'dz', 'fl', 'fr', 'gl', 'gn', 'gr', 'kl', 'kr', 'ks', 'mn', 'ph', 'pl', 'pr', 'ps', 'pt', 'rb', 'rc', 'rd', 'rf', 'rg', 'rj', 'rk', 'rl', 'rm', 'rn', 'rp', 'rq', 'rs', 'rt', 'rv', 'rz', 'sc', 'sk', 'sm', 'sn', 'sp', 'sq', 'st', 'tr', 'ts', 'vl', 'vr', 'zb', 'zd', 'zm'],
    voyelles: ['a', 'e', 'i', 'o', 'u', 'y', 'à', 'â', 'ä', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ö', 'ù', 'û'],
    diphtongues: ['ai', 'ain', 'au', 'an', 'ei', 'ein', 'eu', 'eau', 'ou', 'oui', 'oi', 'oin', 'on', 'ui'],
    PROBA_CONSONNES: [4, 3, 4, 3, 4, 1, 2, 1, 5, 5, 4, 5, 1, 5, 4, 6, 2, 1, 1, 1, 1, 1, 3, 2, 1, 1, 3, 4, 2],
    PROBA_CONSONNES_F: [0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 2, 2, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    PROBA_MULTICONSONNES_D: [2, 2, 3, 3, 3, 1, 2, 1, 2, 2, 2, 3, 3, 1, 1, 0, 1, 2, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 3, 3, 1, 1, 2, 0, 0, 0],
    PROBA_MULTICONSONNES: [2, 2, 3, 3, 3, 1, 2, 1, 2, 2, 2, 3, 3, 1, 1, 1, 1, 2, 3, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 3, 1, 1, 1, 1, 1, 1, 2, 1, 3, 3, 1, 1, 2, 1, 1, 1],
    PROBA_VOYELLES: [10, 12, 9, 9, 5, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1],
    PROBA_VOYELLES_F: [1, 4, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    PROBA_DIPHTONGUES: [1, 1, 2, 2, 1, 1, 2, 1, 3, 1, 3, 1, 3, 1],
    PROBA_DIPHTONGUES_F: [0, 3, 1, 2, 0, 1, 1, 2, 1, 0, 0, 1, 3, 0],
    syllabe: function (position, max) {
      if (position === 1) {
        let consonne = ''
        if (de(3) > 1) {
          do {
            consonne = (de(7) > 1)
              ? probaSwitch(Generateur.Mots.consonnes, Generateur.Mots.PROBA_CONSONNES)
              : probaSwitch(Generateur.Mots.multiConsonnes, Generateur.Mots.PROBA_MULTICONSONNES_D)
          }
          while ((consonne.length > 1) && consonne.estHomogene())
        }
        const voyelle = (de(5) > 1)
          ? probaSwitch(Generateur.Mots.voyelles, Generateur.Mots.PROBA_VOYELLES)
          : probaSwitch(Generateur.Mots.diphtongues, Generateur.Mots.PROBA_DIPHTONGUES)
        return consonne + voyelle
      } else if (position === max) { // améliorer les finales (+ ajouter meta-donnees ici ?)
        let syll
        if (de(3) > 1) {
          const consonne = (de(7) > 1)
            ? probaSwitch(Generateur.Mots.consonnes, Generateur.Mots.PROBA_CONSONNES)
            : probaSwitch(Generateur.Mots.multiConsonnes, Generateur.Mots.PROBA_MULTICONSONNES)
          const voyelle = (de(5) > 1)
            ? probaSwitch(Generateur.Mots.voyelles, Generateur.Mots.PROBA_VOYELLES_F)
            : probaSwitch(Generateur.Mots.diphtongues, Generateur.Mots.PROBA_DIPHTONGUES_F)
          syll = consonne + voyelle
        } else {
          const consonne = (de(7) > 1)
            ? probaSwitch(Generateur.Mots.consonnes, Generateur.Mots.PROBA_CONSONNES)
            : probaSwitch(Generateur.Mots.multiConsonnes, Generateur.Mots.PROBA_MULTICONSONNES)
          const voyelle = (de(5) > 1)
            ? probaSwitch(Generateur.Mots.voyelles, Generateur.Mots.PROBA_VOYELLES)
            : probaSwitch(Generateur.Mots.diphtongues, Generateur.Mots.PROBA_DIPHTONGUES)
          const term = probaSwitch(Generateur.Mots.consonnes, Generateur.Mots.PROBA_CONSONNES_F)
          syll = consonne + voyelle + term
        }
        return syll
      } else {
        const consonne = (de(7) > 1)
          ? probaSwitch(Generateur.Mots.consonnes, Generateur.Mots.PROBA_CONSONNES)
          : probaSwitch(Generateur.Mots.multiConsonnes, Generateur.Mots.PROBA_MULTICONSONNES)
        const voyelle = (de(5) > 1)
          ? probaSwitch(Generateur.Mots.voyelles, Generateur.Mots.PROBA_VOYELLES)
          : probaSwitch(Generateur.Mots.diphtongues, Generateur.Mots.PROBA_DIPHTONGUES)
        return consonne + voyelle
      }
    },
    mot: function (nbSyllabes) {
      let motRetour = ''
      for (let i = 0; i < nbSyllabes; ++i) {
        const syll = Generateur.Mots.syllabe(i + 1, nbSyllabes)
        motRetour += syll
      }
      return motRetour.replace(/q([^u ])/g, 'qu$1')
    }
  },

  date: function () {
    const d = Date.random()
    const tps = (d < new Date()) ? 1 : 3
    const o = { lettres: 1 }
    if (de(2) > 1) o.jour = 1
    return 'le ' + d.formater(o) + '¤' + tps
  },

  annee: function () {
    let deb = ''; let fin = ''; const a = (de(4000) - 1001) || 3000
    if (a < 300) {
      fin = ((a < 0) ? ' avant' : ' après') + ' J.C.'
    }
    if ((a < 1000) || (a > 2100)) deb = "l'an "
    return 'en ' + deb + Math.abs(a) + fin
  }
}

// FONCTION : insère une sous-chaine dans la chaine courante
// PARAM #1 : "chaine" (string) : sous-chaine à insérer
// PARAM #2 : "indice" (number) : emplacement de l'insertion
// RETOUR : chaine (construite à partir de la chaine courante)
String.prototype.inserer = function (chaine, indice) {
  if ((indice < 0) || (indice > this.length) || !chaine.toString) { return false }
  return this.substr(0, indice) + chaine + this.substr(indice)
}

// FONCTION : remplace dans la chaine courante les lettres accentuées par leurs équivalents non accentués
// RETOUR : chaine (construite à partir de la chaine courante)
String.prototype.sansAccents = function () {
  return this.replace(/[ùûü]/g, 'u').replace(/[îï]/g, 'i').replace(/[àâä]/g, 'a').replace(/[ôö]/g, 'o').replace(/[éèêë]/g, 'e').replace(/ç/g, 'c').replace(/œ/g, 'oe')
}

// FONCTION : controle si une chaine est composée de caractères identiques
// RETOUR : booléen. renvoie "false" uniquement si la chaine continent au moins 2 caractères différents
String.prototype.estHomogene = function () {
  if (this.length > 1) {
    for (let i = 1, iMax = this.length; i < iMax; ++i) {
      if (this.charAt(0) !== this.charAt(i)) { return false }
    }
  }
  // -_-'
  return true
}

String.prototype.voyelle = function () {
  return (/^[aeiouyhàâäéèêëîïôöùûüœ]/i).test(this)
}

// superbe fusil à mouches ^^ neuf dans son étui : n'a jamais servi
Number.prototype.estMultipleDe = function (val) {
  return (val && (type(val).indexOf('number') > -1) && (val !== 0)) ? ((this % val) === 0) : false
}

// FONCTION : convertit un nombre en chaine de chiffres, avec le formatage souhaité
// PARAM #1 : "decimales" (number) : nombre de décimales souhaitées à l'affichage (ne modifie en rien le nombre courant)
// PARAM #2 : "sepDecimal" (string) : SI ce param est présent, il remplace le "." comme séparateur décimal
// PARAM #3 : "sepMilliers" (string) : SI ce param est présent, il est utilisé comme séparateur des milliers/millions/milliards/etc.
// RETOUR : chaine représentant le nombre courant
Number.prototype.formater = function (decimales, sepDecimal, sepMilliers) {
  let resultat = this.toFixed(decimales)
  if (sepDecimal) resultat = resultat.replace(/\./, sepDecimal)
  if (sepMilliers) {
    let offset = 0
    let posPoint = resultat.indexOf((sepDecimal) || '.')
    if (posPoint === -1) {
      posPoint = resultat.length
    }
    while ((posPoint - offset) > 3) {
      resultat = resultat.inserer(sepMilliers, (posPoint - offset - 3))
      offset += 3
    }
  }
  return resultat
}

// FONCTION : convertit le nombre courant en toutes lettres (sans l'éventuelle partie décimale)
// RETOUR : chaine représentant le nombre courant
Number.prototype.enLettres = function () {
  if (Math.abs(this) > 999999999999) return false

  const negatif = (this < 0)
  let chaine = Math.abs(this).toFixed()
  if (chaine === '1001') return ((negatif) ? 'moins ' : '') + 'mille-et-un'

  // tableau de correspondance pour tout nombre compris entre 0 et 99
  // on accède par exemple à "42" par >>> nombresFr[4][2]
  const nombresFr = [
    ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', '£uit', 'neuf'],
    ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'],
    ['vingt', 'vingt et un', 'vingt-deux', 'vingt-trois', 'vingt-quatre', 'vingt-cinq', 'vingt-six',
      'vingt-sept', 'vingt-huit', 'vingt-neuf'],
    ['trente', 'trente et un', 'trente-deux', 'trente-trois', 'trente-quatre', 'trente-cinq', 'trente-six',
      'trente-sept', 'trente-huit', 'trente-neuf'],
    ['quarante', 'quarante et un', 'quarante-deux', 'quarante-trois', 'quarante-quatre', 'quarante-cinq',
      'quarante-six', 'quarante-sept', 'quarante-huit', 'quarante-neuf'],
    ['cinquante', 'cinquante et un', 'cinquante-deux', 'cinquante-trois', 'cinquante-quatre', 'cinquante-cinq',
      'cinquante-six', 'cinquante-sept', 'cinquante-huit', 'cinquante-neuf'],
    ['soixante', 'soixante et un', 'soixante-deux', 'soixante-trois', 'soixante-quatre', 'soixante-cinq',
      'soixante-six', 'soixante-sept', 'soixante-huit', 'soixante-neuf'],
    ['soixante-dix', 'soixante et onze', 'soixante-douze', 'soixante-treize', 'soixante-quatorze',
      'soixante-quinze', 'soixante-seize', 'soixante-dix-sept', 'soixante-dix-huit', 'soixante-dix-neuf'],
    ['quatre-vingt', 'quatre-vingt-un', 'quatre-vingt-deux', 'quatre-vingt-trois', 'quatre-vingt-quatre',
      'quatre-vingt-cinq', 'quatre-vingt-six', 'quatre-vingt-sept', 'quatre-vingt-huit', 'quatre-vingt-neuf'],
    ['quatre-vingt-dix', 'quatre-vingt-onze', 'quatre-vingt-douze', 'quatre-vingt-treize', 'quatre-vingt-quatorze',
      'quatre-vingt-quinze', 'quatre-vingt-seize', 'quatre-vingt-dix-sept', 'quatre-vingt-dix-huit', 'quatre-vingt-dix-neuf']
  ]
  const grandeursFr = [['cent', 'mille', 'million', 'milliard'], ['cents', 'mille', 'millions', 'milliards']]

  // découpage de la chaine en blocs de 3 chiffres, en partant des unités
  // par exemple, pour le nombre courant 42150, on obtient après cette étape le tableau suivant : tabBloc >>> ["42", "150"]
  const blocs = []
  let longueur = chaine.length
  while (longueur > 0) {
    if (longueur > 3) {
      blocs.splice(0, 0, chaine.substr((longueur - 3), 3))
      chaine = chaine.substr(0, longueur - 3)
    } else {
      blocs.splice(0, 0, chaine)
      chaine = ''
    }
    longueur = chaine.length
  }

  // boucle sur les blocs : découpage du bloc courant, calcul de la chaine correspondante au bloc courant, stockage dans le tabResultat
  const tabResultat = []; let tabBloc; let bloc
  for (let i = 0; i < blocs.length; ++i) {
    bloc = blocs[i]
    tabBloc = []
    for (let j = 0; j < bloc.length; ++j) {
      tabBloc.push(parseInt(bloc.substr(j, 1), 10))
    }
    while (tabBloc.length < 3) {
      tabBloc.splice(0, 0, 0)
    }
    const sousResultat = nombresFr[tabBloc[1]][tabBloc[2]]
    if (tabBloc[0] > 1) {
      const exception100 = (tabBloc[0] > 1) && (sousResultat === 'zéro') && (i === (blocs.length - 1))
      const centaines = nombresFr[0][tabBloc[0]] + ' ' + grandeursFr[(exception100) ? 1 : 0][0]
      tabResultat.push(centaines + ((sousResultat === 'zéro') ? '' : ' ' + sousResultat))
    } else if (tabBloc[0] === 1) {
      tabResultat.push('cent' + ((sousResultat === 'zéro') ? '' : ' ' + sousResultat))
    } else if (sousResultat !== 'zéro') {
      tabResultat.push(sousResultat)
    }
    if ((blocs.length > (i + 1)) && (bloc !== '000')) {
      const grandeur = grandeursFr[(tabResultat[i] === 'un') ? 0 : 1][blocs.length - i - 1]
      tabResultat[((i === (blocs.length - 2)) && (bloc === '1')) ? (tabResultat.length - 1) : tabResultat.length] = grandeur
    }
    if ((/80$/).test(bloc) && (blocs.length === (i + 1))) {
      tabResultat[tabResultat.length - 1] = tabResultat[tabResultat.length - 1].replace(/quatre-vingt/, 'quatre-vingts')
    }
  }
  const resultat = tabResultat.join(' ')
  return (((negatif) ? 'moins ' : '') + resultat) || nombresFr[0][0]
}

// rustine tirée de Prototype (merci les gars ^_^') pour assurer Array.indexOf dans IE
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (item, i) {
    i || (i = 0)
    const length = this.length
    if (i < 0) i = length + i
    for (; i < length; i++) { if (this[i] === item) return i }
    return -1
  }
}

// FONCTION : prend un élément au hasard dans le tableau courant
// PARAM : si présent et évalué "true", supprime du tableau courant l'élément désigné
// RETOUR : l'élément désigné aléatoirement
Array.prototype.puiser = function (vidage) {
  const jet = de(this.length) - 1
  const retour = this[jet]
  if (vidage) this.splice(jet, 1)
  return retour
}

// FONCTION : ajoute un ou plusieurs éléments à chacun des tableaux contenus dans le tableau courant
// RETOUR : aucun
// ATTENTION : ne fonctionne que sur un tableau de tableaux, pas de contrôle/remontée d'erreur de type
Array.prototype.pushEach = function () {
  for (let j = 0, jMax = arguments.length; j < jMax; ++j) {
    const val = arguments[j]
    for (let i = 0, iMax = this.length; i < iMax; ++i) {
      this[i].push(val)
    }
  }
}

// FONCTION : copie le tableau courant par valeur (et non pas deux références au même élément)
// RETOUR : copie conforme du tableau courant (taille, indices, valeurs)
Array.prototype.cloner = function () {
  const clone = []
  for (let i = 0; i < this.length; ++i) {
    clone[i] = (type(this[i]) === 'array') ? this[i].cloner() : this[i]
  }
  return clone
}

// FONCTION : additionne toutes les valeurs numériques contenues dans un tableau, et ignore les autres valeurs
// RETOUR : la somme calculée
Array.prototype.additionner = function () {
  let somme = 0
  for (let i = 0, iMax = this.length; i < iMax; ++i) {
    if (type(this[i]).indexOf('number') > -1) {
      somme += this[i]
    }
  }
  return somme
}

// FONCTION : repère les doublons dans le tableau courant
// RETOUR : tableau contenant les doublons
Array.prototype.chercherDoublons = function () {
  const doublons = []
  for (let i = 0; i < this.length - 1; ++i) {
    for (let j = i + 1; j < this.length; ++j) {
      if (this[i] === this[j]) {
        doublons.push(this[j])
      }
    }
  }
  return doublons.cloner()
}

// FONCTION : aplatit un tableau de tableaux en un tableau plat
// RETOUR : tableau contenant tous les éléments des tableaux imbriqués
Array.prototype.aplatir = function () {
  return this.reduce(function (resultat, suivant) {
    return resultat.concat(Array.isArray(suivant) ? suivant.aplatir() : suivant)
  }, [])
}

// FONCTION : formate la date courante selon les options choisies
// PARAM #1 : "options" (objet anonyme) comportant 6 options :
// "separateur"      >>> si présent, est utilisé pour séparer les trois groupes de nombres ; inutile si "lettres" (toujours séparateur espace)
// "inverse"         >>> si "équivalent à TRUE", format AMJ à la place de JMA
// "zeros"           >>> si "équivalent à TRUE", les zéros non-significatifs sont conservés (ex : mai >>> 05)
// "AA"              >>> si "équivalent à TRUE", l'année n'est représentée que sur deux chiffres
// "jour"            >>> si "équivalent à TRUE", le jour de la semaine préfixe la chaine (mot complet avec "options.lettres", sinon seulement l'initiale en capitale)
// "lettres"         >>> si "équivalent à TRUE", le nom du mois est écrit en toutes lettres
// RETOUR : chaine représentant la date courante
Date.prototype.formater = function (options) {
  options = options || {}
  const resultat = []; let retour = ''
  resultat[options.inverse ? 2 : 0] = (options.zeros && this.getUTCDate() < 10) ? '0' + this.getUTCDate() : this.getUTCDate()
  resultat[1] = (options.zeros && this.getUTCMonth() < 9) ? '0' + (this.getUTCMonth() + 1) : this.getUTCMonth() + 1
  resultat[options.inverse ? 0 : 2] = options.AA ? this.getUTCFullYear().toString().substr(2) : this.getUTCFullYear()

  if (options.lettres) {
    const moisFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    resultat[1] = moisFr[parseInt((resultat[1] - 1), 10)]
    options.separateur = ' '
    if (this.getUTCDate() === 1) resultat[options.inverse ? 2 : 0] += 'er'
  }

  if (options.jour) {
    const joursFr = options.lettres
      ? ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
      : ['D', 'L', 'M', 'M', 'J', 'V', 'S']
    retour = resultat.join(options.separateur ? options.separateur : '')
    retour = joursFr[this.getDay()] + ' ' + retour
    return retour
  }
  return resultat.join(options.separateur ? options.separateur : '')
}

Date.random = function () {
  return new Date(de(new Date().getTime() * 11) - (new Date().getTime() * 8))
}

// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
// -----------------------------  FONCTIONS GENERALES  ---------------------------

// FONCTION : détermine le type de l'objet passé en paramètre
// PARAM #1 : "objet" (object) : objet à examiner
// RETOUR : chaine décrivant le type :
// ("string", "number(int)", "number(float)", "date", "array", "function", "element", "node", "object", "undefined")
function type (objet) {
  if (typeof objet === 'string') { return 'string' }
  if (typeof objet === 'number') { return (Math.round(objet) !== objet) ? 'number(float)' : 'number(int)' }
  if ((objet !== null) && ('getUTCFullYear' in objet)) { return 'date' }
  if (typeof objet === 'function') { return 'function' }
  if ((objet !== null) && ('splice' in objet) && ('join' in objet)) { return 'array' }
  if ((objet !== null) && objet.nodeType) { return (objet.nodeType === Node.ELEMENT_NODE) ? 'element' : 'node' }
  if ((objet !== null) && (typeof objet === 'object')) { return 'object' }

  return 'undefined'
}

// FONCTION : simulation de jet de dé
// PARAM #1 : "max" (number) : nombre de "faces"
// RETOUR : entier aléatoire entre 1 et "max"
function de (max) {
  if (max < 1) { return 0 }
  return Math.round((Math.random() * max) + 0.5)
}

function deProgressif1 () {
  let nombre; const jetQuantite = de(100)
  if (jetQuantite < 60) {
    nombre = de(4) + 1
  } else if (jetQuantite < 90) {
    nombre = de(10) + de(10) + de(10)
  } else if (jetQuantite < 97) {
    nombre = de(10) * 10
  } else if (jetQuantite < 99) {
    nombre = de(100) * 100
  } else {
    nombre = de(1000) + 1
  }
  return nombre
}

function probaSwitch (tabValeurs, tabPoids) {
  if (tabValeurs.length !== tabPoids.length) {
    alert('arguments de la fonction probaSwitch() mal formés :\ntabValeurs.length = ' + tabValeurs.length + '\ntabPoids.length = ' + tabPoids.length)
    return null
  }

  const somme = tabPoids.additionner()
  const echelle = 100 / somme
  for (let i = 0, iMax = tabValeurs.length; i < iMax; ++i) {
    tabPoids[i] *= echelle
  }

  let seuil; const tirage = Math.random() * 100
  for (let i = 0, iMax = tabValeurs.length; i < iMax; ++i) {
    seuil = 0
    for (let j = 0; j <= i; ++j) {
      seuil += tabPoids[j]
    }
    if (tirage <= seuil) {
      return tabValeurs[i]
    }
    if (i === (iMax - 1)) {
      return tabValeurs[i]
    }
  }
  return null
}

module.exports = Phrase
