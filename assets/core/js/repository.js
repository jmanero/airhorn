/**
 * Execute this whole mess after Bootstrap
 * and jQuery have done their crafty magic...
 */
setTimeout(function() {
  function fetchRepositories(link) {
    var url = link.attr("data-type") + "/" + link.attr("data-org") + "/repositories";
    var panel = $(link.attr("href"));
    Request.partial(url, panel, function(err, content) {
      // Create hooks to load repo detail
      content.find(".panel-collapse").on("show.bs.collapse", function(e) {
        console.log("Load " + $(this).attr("data-repo"));
        fetchRepositoryDetail($(this));
      });
    });
  }

  function fetchRepositoryDetail(panel) {
    var url = "repository/" + panel.attr("data-owner") + "/" + panel.attr("data-repo");
    Request.partial(url, panel.find(".panel-body"), function(err, content) {

    });
  }

  $(document).ready(function() {
    $(".repositories-tab a").click(function(e) {
      e.preventDefault();
      $(this).tab('show');

      // Fetch and render repo list
      fetchRepositories($(this));
    });

    fetchRepositories($("#user-repositories-link a"));
  });
}, 10);
