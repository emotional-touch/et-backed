// const inputEl = document.querySelector('input[type="password"]');

// const dummyEl = document.querySelector('#dummy');

// const resultEl = document.querySelector('#result');

// inputEl.addEventListener('keyup', () => {
//   const dummyText = Array(inputEl.value.length).fill('*').join('');
//   dummyEl.innerHTML = dummyText;
//   resultEl.innerHTML = inputEl.value;
// })


$('.cmn_table').DataTable( {
  responsive: true,
  searching: true,
  info: false,
  paginate: true,
  dom: 'ftp',
  // pagingType: 'full_numbers',
  // fixedHeader: true,
  // paging: false,


  // scrollCollapse: true,
  // scrollY: '200px',  
  language: {
      searchPlaceholder: "Search",
      search: ""
  },
  sorting: false,
  stripeClasses: []


} );


// $('.custom_cmn_table').DataTable( {
//   responsive: true,
//   searching: true,
//   info: false,
//   paginate: true,
//   dom: 'ftp',
//   // pagingType: 'full_numbers',
//   // fixedHeader: true,
//   // paging: false,


//   // scrollCollapse: true,
//   // scrollY: '200px',  
//   language: {
//       searchPlaceholder: "Search",
//       search: ""
//   },
//   sorting: false,
//   stripeClasses: []


// } );


// $(document).ready(function(){
//   $('#hide_eye').click(function(){
//       $('#exampleInputPassword1').attr('type', 'text');
     
//   });
// });



$(document).ready(function(){
  $('input[type="search"]').click(function(){
    $('input[type="search"]').toggleClass('shown');
  });
});

$(document).ready(function(){
  $('.sidenav_toggle').click(function(){
    $('.content').toggleClass('half_width');
    $('.dashboard_side').toggleClass('show');
  });

  
});

function alertBox(alertData, url){
  Swal.fire({
    title: alertData.title,
    text: alertData.text,
    icon: alertData.icon,
    showCancelButton: true,
    confirmButtonText: alertData.btnText,
    cancelButtonText: 'Cancel'
  }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = url;
      }
  });
}

$.validator.addMethod("pwcheck", function(value) {
  return /^.*(?=.{8,})(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/.test(value) // consists of only these
  && /[a-z]/.test(value) // has a lowercase letter
  && /\d/.test(value) // has a digit
}, "Password must contain at least 8 characters - including uppercase, lowercase, special characters and numbers.");


// $(document).ready(function() {
  
// });

// $(document).ready(function(){
//   $('#hide_eye').click(function(){
//     $('#show_eye').addClass('active');
//     $('#hide_eye').removeClass('active');
//   })
//   $('#show_eye').click(function(){
//     $('#hide_eye').addClass('active');
//     $('#show_eye').removeClass('active');
//   })
//   $('.fa-eye-slash.active')
// });



var clicked = 0;

  $(".toggle-password").click(function (e) {
     e.preventDefault();

    $(this).toggleClass("toggle-password");
      if (clicked == 0) {
         $(this).html('<span class="material-icons"><i class="fa fa-eye-slash"></i></span >');
         clicked = 1;
      } else {
         $(this).html('<span class="material-icons"><i class="fa fa-eye"></i></span >');
          clicked = 0;
       }

    var input = $($(this).attr("toggle"));
    if (input.attr("type") == "password") {
       input.attr("type", "text");
    } else {
       input.attr("type", "password");
    }
});




