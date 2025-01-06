const nav = document.querySelector('#header nav')
const toggle = document.querySelectorAll('nav .toggle')
const notify = document.getElementById("notificaciones");
const toggleClose = document.getElementById('close');
const toggleOpen = document.getElementById('open')
const x = document.getElementById('x');
const hack = document.getElementById('hack');


const contentNotify = document.getElementById("content-notification");

hack.addEventListener('click', () => {
  contentNotify.style.display = "block";
})


x.addEventListener('click',() => {
  contentNotify.style.display = "none";
})



for(const element of toggle) {
  element.addEventListener('click', () => {
    nav.classList.toggle('show');
    
  })
}

const links = document.querySelectorAll('nav ul li a')
for (const link of links) {
  link.addEventListener('click', () => {
    nav.classList.remove('show');
  })
}


toggleClose.addEventListener('click', () => {
  notify.style.display = "block";
})

toggleOpen.addEventListener('click', () => {
  notify.style.display = "none";
})



const header = document.querySelector("#header")
const navHeight = header.offsetHeight
function changeHeaderWhenScroll() {
  
    if(window.scrollY >= navHeight) {
      header.classList.add('scroll')
    } else {
      header.classList.remove('scroll')
    }
}

const swiper = new Swiper('.swiper', {
  slidesPerView: 1,
  pagination: {
    el: '.swiper-pagination'
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  mousewheel: true,
  keyboard: true,
  breakpoints: {
    992: {
      slidesPerView: 2,
      setWrapperSize: true,
    }
  }
});

const scrollReveal = ScrollReveal({
  origin: 'top',
  distance: '30px',
  duration: 700,
  reset: true,
})

scrollReveal.reveal(`#home .text, #home .image, #about .image, #about .text, #services header, #services .card, #testimonials header, #testimonials .testimonials, #contact .text, #contact .links, footer .brand, footer .social`, { interval: 100})
const backToTopButton = document.querySelector('.back-to-top')
function backToTopWhenScroll() {

    if(window.scrollY >= 1680) {
      backToTopButton.classList.add('show')
    } else {
      backToTopButton.classList.remove('show')
    }
}

const sections = document.querySelectorAll('main section[id]')
function activateMenuAtCurrentSection() {
  const checkpoint = window.pageYOffset + ((window.innerHeight / 8) * 4)
  for( const section of sections ) {
    const sectionTop = section.offsetTop
    const sectionHeight = section.offsetHeight
    const sectionId = section.getAttribute('id')

    const checkpointStart = checkpoint >= sectionTop
    const checkpointEnd = checkpoint <= sectionTop + sectionHeight
    if(checkpointStart && checkpointEnd) {
      document.querySelector('nav ul li a[href*=' + sectionId + ']').classList.add('active')
    } else {
      document.querySelector('nav ul li a[href*=' + sectionId + ']').classList.remove('active')
    }

  }
}
window.addEventListener('scroll', () => {
  changeHeaderWhenScroll()
  backToTopWhenScroll()
  activateMenuAtCurrentSection()
})
