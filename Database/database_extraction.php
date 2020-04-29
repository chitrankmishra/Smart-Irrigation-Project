<?php
    $connection=mysqli_connect("localhost","root","");
        if($connection->error==NULL)
        {}
        else
            echo "connection failed";

        $query="use smartirrigation;";
        $connection->query($query);

        //$query= "select * from weather_codes;";
        //$query="select * from grass;";
        //$query="select * from city_codes;";

        
        $res= $connection->query($query);
        if($res->num_rows>0){
            while($row=$res->fetch_assoc())
            {
                //echo '{ "city" : "'.$row['city_name'].'" , "code" : '.$row['code'].' },    <br>';
                //echo '{ "code" : '.$row['code'].', "class" : "'.$row['class'].'", "detail" : "'.$row['detail'].'" },<br>';
                //echo '{ "period-start" : '.$row['month'].' , "period-end" : '.$row['monthend'].' , "min_height" : '.$row['min_height'].' , "max_height" : '.$row['max_height'].' }, <br>';
            }
        }
?>