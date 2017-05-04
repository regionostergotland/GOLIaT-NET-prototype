using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Akutjournalen.Controllers
{
    public class AnamnesController : Controller
    {


        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "CDS";
            @ViewBag.SubPageHeader = "";            
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";

            @ViewBag.PageUserRoll = "Administrator";        // Skall vi göra en session av denna eller en global class eller hanteras i bas controll, innehåll skall hantera vid login ?
        }
        //
        // GET: /Triage/
        public ActionResult Index()
        {
            return View();
        }
	}
}