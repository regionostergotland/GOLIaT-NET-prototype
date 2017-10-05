using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Goliat.Controllers
{
    public class OplaneradeOpController : Controller
    {

        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            @ViewBag.PageHeader = "Planering av operation";
            @ViewBag.SubPageHeader = "Urologkliniken";
            @ViewBag.PageLevel = "";
            @ViewBag.PageSubLevel = "";

            @ViewBag.PageUserRoll = "";
        }

        // GET: OplaneradeOp
        public ActionResult Index()
        {
            return View();
        }


        public ActionResult Planeringsunderlag()
        {
            return View();
        }
    }
}