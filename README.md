# AeroManip-VLA project page

Static project page (plain HTML/CSS/JS, no build step).

## Preview locally

```bash
cd website
python -m http.server 8000
```

Then open http://localhost:8000. (Opening `index.html` directly also works, but the YouTube / Bilibili embeds need a real `http://` origin.)

## Set the links

Edit `SITE_CONFIG` at the top of `static/js/main.js`:

| key        | what to put                                   |
|------------|-----------------------------------------------|
| `paper`    | arXiv abstract URL                            |
| `pdf`      | direct PDF / OpenReview URL                   |
| `github`   | code repository                               |
| `dataset`  | dataset page                                  |
| `youtube`  | YouTube video URL (embedded in the page)      |
| `bilibili` | Bilibili video URL with a `BV…` id (embedded) |

Any value still containing `xxxx` or `VIDEO_ID` is treated as a placeholder: the button shows a "soon" badge and the player shows a "coming soon" card.

## Deploy with GitHub Pages

1. Push this folder's contents to the root of a repository.
2. Repository → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. The site is served at `https://<user>.github.io/<repo>/`.

## Layout

```
index.html
static/css/style.css
static/js/main.js        # SITE_CONFIG lives here
static/images/           # paper figures + video posters
static/videos/           # compressed H.264 MP4s (faststart)
```
