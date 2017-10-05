using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;
using System.Data.Entity;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Linq;

namespace Goliat.Models
{
    public class UnderlagModel
    {
        //[BsonId]
        //[BsonRepresentation(BsonType.ObjectId)]

        public ObjectId _id { get; private set; }
        public string ehrid { get; set; }
        public string current_state { get; set; }
        public string firstname { get; set; }
        public string lastname { get; set; }
        public string gender { get; set; }
        public string personnummer { get; set; }
        public string SVF { get; set; }
        public string diagnoskod { get; set; }
        public string ansvarig_enhet { get; set; }
        public string time_created { get; set; }
        public string start_date_countdown { get; set; }
        public string utredning_id { get; set; }
        public string instruction_id { get; set; }
        public string activity_id { get; set; }
        public string filled_form_status { get; set; }
    }

}