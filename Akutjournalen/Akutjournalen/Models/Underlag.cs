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

namespace Akutjournalen.Models
{
    public class UnderlagModel
    {
        //[BsonId]
        //[BsonRepresentation(BsonType.ObjectId)]
        public ObjectId _id { get; private set; }
        //public string ID { get; set; }
        public string ehrid { get; set; }
        public string current_state { get; set; }
        public string firstname { get; set; }
        public string lastname { get; set; }
        public string gender { get; set; }
        public string personnummer { get; set; }
        public string time_created { get; set; }
        public string start_date_countdown { get; set; }
        public string utredning_id { get; set; }
        public string filled_form_status { get; set; }
    }

}