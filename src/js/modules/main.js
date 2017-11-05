$(document).ready(function(){
	$('.main-carousel').flickity({
	  // options
	  cellAlign: 'left',
	  contain: false,
	  autoPlay: 4000,
	  initialIndex: 0,
	  arrows: true
	});

	$('.slick-slider').slick({
	  centerMode: true,
	  centerPadding: '70px',
	  slidesToShow: 1,
	  responsive: [
	    {
	      breakpoint: 768,
	      settings: {
	        arrows: false,
	        centerMode: true,
	        centerPadding: '40px',
	        slidesToShow: 3
	      }
	    },
	    {
	      breakpoint: 480,
	      settings: {
	        arrows: false,
	        centerMode: true,
	        centerPadding: '40px',
	        slidesToShow: 1
	      }
	    }
	  ]
	});
});