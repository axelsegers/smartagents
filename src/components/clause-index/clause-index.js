// <sa-clause-index> — marks the clause the reader is in.
//
// The privacy notice's rail is an index of eight clauses over 2420px of prose,
// and it is sticky, so on a desk it is on screen for the whole document. What
// it could not say is where in that document the reader has got to: every row
// looked the same at the top of the page and at the bottom of it. `:target`
// marks the heading itself, which answers the click but says nothing once the
// reader scrolls on, and scrolling on is what a reader of a legal notice does
// after they have found the clause they came for.
//
// So: the last heading whose top has passed under the header is the current
// one, and its row carries `aria-current="location"`. That is the token for a
// position within a set rather than a page in a site, which is what this is.
//
// It is progressive enhancement in the strict sense — the index is eight
// working links with this file absent, and this only adds an attribute. The
// element wraps the list rather than replacing it, so the `<nav>` landmark and
// its heading are untouched. It is a plain block in main.css and not
// `display: contents`, for a reason recorded there: with no box of its own the
// lazy-loader's IntersectionObserver never sees it and this file never loads.
//
// It owns both marks, not just the rail's. The heading's own mark is
// `:target` with this file absent — the no-JS half — but `:target` is set by the
// last hash and outlives it, while the row's mark tracks the scroll, and the two
// are the same 2px cyan rule. Left to their own lifetimes they name different
// clauses in the same viewport: click a row, scroll back 200px to re-read the
// end of the previous clause, and the rail marks one clause while the copy marks
// another 300px away. One owner, one answer.
//
// No layout is read during a scroll. Every heading's document offset is
// measured once and again on resize, and the scroll handler compares numbers.
class ClauseIndex extends HTMLElement {
  connectedCallback() {
    this.links = [...this.querySelectorAll('a[href^="#"]')];
    this.targets = this.links
      .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
      .filter(Boolean);

    // A row per heading or nothing: a partial map would light the wrong row.
    if (this.targets.length !== this.links.length || !this.targets.length) return;

    this.offsets = [];
    this.current = -1;

    // Bound once and kept, so a disconnect-and-reconnect removes the same
    // functions it added rather than leaking the first pair.
    this.onScroll ||= this.onScroll_.bind(this);
    this.onResize ||= this.onResize_.bind(this);

    // The flag the stylesheet reads to stand `:target` down: with this element
    // alive the mark is the spy's, and `:target` would be a second opinion.
    document.documentElement.dataset.clauseSpy = '';

    this.measure();
    addEventListener('scroll', this.onScroll, { passive: true });
    addEventListener('resize', this.onResize, { passive: true });
    // A row pressed while the page is already at its foot moves the hash and
    // nothing else, so there is no scroll event to recompute on — and the foot
    // is the one place the hash is what decides. Pressing the last row after
    // the second-to-last left the index a row behind without this.
    addEventListener('hashchange', this.onScroll);
  }

  disconnectedCallback() {
    delete document.documentElement.dataset.clauseSpy;
    // Both marks, not one. Cleared asymmetrically, a reconnect left the rail
    // lit on a clause nobody was in: `connectedCallback` resets `current` to
    // -1, and at the top of the page `update()` computes -1 too and takes the
    // early-out without ever touching the stale attribute.
    this.links[this.current]?.removeAttribute('aria-current');
    this.targets[this.current]?.classList.remove('is-current-clause');
    this.current = -1;
    removeEventListener('scroll', this.onScroll);
    removeEventListener('resize', this.onResize);
    removeEventListener('hashchange', this.onScroll);
  }

  /* The line a heading counts as reached at is the one an anchor lands on, so
     the row that is lit is the row that would have sent you there. It is read
     off `scroll-padding-top` rather than repeated here, because that value
     changes with the header's own height at the tablet breakpoint. */
  measure() {
    const scrolled = scrollY;
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    this.line = padding + 1;
    this.offsets = this.targets.map((target) => target.getBoundingClientRect().top + scrolled);
    // The furthest the document can be scrolled. Read here rather than in the
    // scroll handler, for the same reason the offsets are.
    this.floor = document.documentElement.scrollHeight - innerHeight;
    this.stale = false;
    this.update();
  }

  onScroll_() {
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => {
      this.pending = false;
      if (this.stale) this.measure();
      else this.update();
    });
  }

  /* Resize goes through the same frame gate as scroll rather than measuring on
     the event. Nine forced layouts per resize tick is the wrong shape anywhere,
     and on iOS the collapsing URL bar fires `resize` *during* a scroll, which is
     exactly the case this component is written to stay out of the way of. */
  onResize_() {
    this.stale = true;
    this.onScroll_();
  }

  update() {
    const reached = scrollY + this.line;

    let index = 0;
    while (index + 1 < this.offsets.length && this.offsets[index + 1] <= reached) index += 1;

    // Above the first clause nothing is current: the reader is still in the head.
    if (reached < this.offsets[0]) index = -1;

    /* The last clauses of a long notice never cross the line, because the
       document runs out of scroll before they reach it — on a 1440x900 desk the
       final two headings of the Dutch notice sit past the furthest the page can
       go, so the index said "Cookies" to a reader looking straight at "Uw
       rechten". It said it to anyone who clicked those rows, too, which is the
       worst version: an index that lies about the row you just pressed.

       At the foot of the document, then, the line stops deciding. If the reader
       got there by pressing a row, that row is the answer and the hash says
       which — which is the only way the last two rows can ever be right about a
       click, since both of them land the page in the same place. Otherwise it
       is the last heading on screen, which is what a reader who scrolled to the
       bottom is looking at. Everywhere else the line decides. */
    if (scrollY >= this.floor - 1) {
      const asked = this.links.findIndex((link) => link.hash === location.hash);
      const askedTop = asked < 0 ? -1 : this.offsets[asked] - scrollY;

      // A hash outlives the press that set it. Honoured unconditionally it made
      // the mark travel *backwards*: press clause five, read on to the end, and
      // at the floor the index jumped back to a heading 376px above the top of
      // the screen. It counts only while the clause it names is still in view —
      // which is always true of a press that reached the floor, because a
      // heading is unreachable by the line exactly when it sits between the
      // line and the foot of that last screen.
      if (askedTop >= 0 && askedTop < innerHeight) {
        index = asked;
      } else {
        let last = this.offsets.length - 1;
        while (last > 0 && this.offsets[last] > scrollY + innerHeight) last -= 1;
        index = Math.max(index, last);
      }
    }

    if (index === this.current) return;

    this.links[this.current]?.removeAttribute('aria-current');
    this.targets[this.current]?.classList.remove('is-current-clause');
    this.links[index]?.setAttribute('aria-current', 'location');
    this.targets[index]?.classList.add('is-current-clause');
    this.current = index;
  }
}

customElements.define('sa-clause-index', ClauseIndex);
