# Le Scribe du Royaume

Calculateur de score pour le jeu de cartes **Fantasy Realms - Édition Deluxe** (version française).

À la fin d'une manche, compter sa main à la main est long et source d'erreurs : les cartes se masquent, s'annulent et se bonifient les unes les autres. L'app fait ce travail. On choisit le mode de jeu, on tape le nom des cartes de sa main, on répond aux quelques questions que le jeu pose vraiment (ce que copie un joker, ce que change le Livre des mutations, ce qu'efface l'Île...), et le total s'affiche avec le détail carte par carte : force de base, bonus, malus, cartes masquées et par qui.

Ce que l'app couvre :

- le **jeu de base** (7 cartes) et l'extension **Le Trésor maudit**, au choix avec les familles supplémentaires (8 cartes), les objets maudits, ou les deux ;
- le décompte d'**une main** à la fois, ou d'**une partie** entière de 2 à 6 joueurs : chaque joueur saisit sa main, valide un récapitulatif, et les scores ne sont révélés qu'à la fin dans un classement commun ;
- toutes les règles sont résolues par l'app, y compris les cas limites (masquages mutuels, malus effacés, cartes à effets).

Interface en français, pensée pour le téléphone, utilisable autour de la table. Application **iOS** ; le navigateur est supporté mais pas optimisé.

---

## Installation

```bash
npm install
```

Node.js est le seul prérequis commun aux trois méthodes ci-dessous.

---

## 1. Dans un navigateur

```bash
npx expo start --web
```

Le navigateur s'ouvre sur `http://localhost:8081`.

Tout le parcours fonctionne, à deux détails près : les vibrations n'existent pas sur le web, et certains interrupteurs gardent le style par défaut du navigateur.

---

## 2. Sur son iPhone avec Expo Go

L'app tourne sur le téléphone, mais reste servie par le Mac.

**Une seule fois :**

1. Installer **Expo Go** depuis l'App Store sur l'iPhone.
2. Créer un compte gratuit sur [expo.dev/signup](https://expo.dev/signup).
3. Ouvrir Expo Go et s'y connecter avec ce compte.
4. Se connecter avec **le même compte** dans le terminal :

```bash
npx expo login
```

Vérifier au besoin avec `npx expo whoami`. Cette étape n'est pas facultative : sur un iPhone physique, Expo Go n'ouvre un projet que si le terminal et l'app sont connectés au même compte Expo.

**À chaque fois :**

```bash
npx expo start
```

Un QR code s'affiche dans le terminal. Sur iPhone, le scanner avec l'app **Appareil photo** (pas depuis Expo Go, qui n'a pas de scanner sur iOS), puis toucher la notification qui apparaît.

Le Mac et l'iPhone doivent être sur le même réseau Wi-Fi. Si le réseau isole les appareils (Wi-Fi public, réseau d'entreprise ou d'école), utiliser `npx expo start --tunnel`.

Si Expo Go refuse d'ouvrir le projet en signalant une incompatibilité de version, installer la version d'Expo Go correspondant au SDK du projet (SDK 57) depuis [expo.dev/go](https://expo.dev/go).

L'app s'arrête de fonctionner dès que le serveur du Mac est coupé. Pour une app autonome, voir la section suivante.

---

## 3. Build Release via Xcode

C'est la bonne méthode pour avoir l'app **installée pour de bon sur l'iPhone**, utilisable sans le Mac et sans connexion.

### Prérequis

- Un Mac avec **Xcode** installé (App Store), lancé au moins une fois pour accepter la licence et installer le composant **iOS**
- **CocoaPods** : `brew install cocoapods`
- Les dépendances du projet : `npm install`
- Un iPhone et un câble USB

### Configuration (une seule fois)

1. Pointer le système vers Xcode :

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

2. Dans Xcode : **Settings > Accounts > +** et ajouter son Apple ID (cela crée un *Personal Team*).
3. Brancher l'iPhone en USB, le déverrouiller et appuyer sur **Se fier à cet ordinateur**.
4. Sur l'iPhone : **Réglages > Confidentialité et sécurité > Mode développeur**, l'activer et confirmer au redémarrage. L'option n'apparaît qu'après le premier branchement au Mac.
5. Le **Bundle Identifier** est déjà renseigné dans `app.json` :

```json
"ios": { "bundleIdentifier": "com.ilianus.scribe-du-royaume" }
```

Il n'y a rien à faire, sauf si l'identifiant est déjà pris par une autre app sur le compte : le remplacer alors par un identifiant unique, par exemple `com.votrenom.scribe-du-royaume`.

### Build et installation

Depuis la racine du projet, iPhone branché :

```bash
npx expo run:ios --device --configuration Release
```

Choisir l'iPhone dans la liste (il apparaît avec le nom générique « iPhone » et sa version d'iOS ; les autres entrées sont des simulateurs). La première compilation est longue, les suivantes beaucoup moins.

Le mode **Release** embarque le JavaScript dans l'app : elle fonctionne ensuite sans le Mac ni le serveur Metro, partout. En Debug, elle chercherait le serveur Metro du Mac et refuserait de démarrer sans lui.

### Faire confiance au profil développeur

Au premier lancement, l'iPhone refuse d'ouvrir l'app. Il faut approuver le profil :

**Réglages > Général > VPN et gestion de l'appareil** > son Apple ID > **Faire confiance**.

### En cas d'erreur de signature

Ouvrir le projet dans Xcode :

```bash
open ios/LeScribeduRoyaume.xcworkspace
```

Dans **Signing & Capabilities**, choisir son **Team** (Personal Team) et vérifier le Bundle Identifier, puis relancer la commande de build.

### Limites du compte gratuit

- L'app **expire au bout de 7 jours** : il suffit de relancer la même commande de build (iPhone branché) pour la réinstaller.
- 3 apps maximum installées simultanément avec un compte gratuit.
- Pour lever ces limites : programme Apple Developer payant (99 € / an).

Le dossier `ios/` est généré par `expo run:ios` et n'est pas suivi par Git (il est déjà dans le `.gitignore`). Le supprimer est sans risque : la commande de build le régénère.

---

## Documentation

Les règles, le catalogue des cartes et le moteur de score sont spécifiés dans `docs/fantasy-realms-reference.md` ; les écrans, le parcours et la direction artistique dans `docs/fantasy-realms-ui-spec.md`. Ces deux documents font foi en cas de désaccord avec le code.
