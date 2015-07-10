<?php

/*
  Sent a gremlin query
 */

// Grab the config
$config = json_decode(file_get_contents('config.json'));

// Gremlin URL
$url = $config->credentials->apiURL . "/gremlin";

// Query Object
$query = new stdClass();
$query->gremlin = "g.V()";

// Make the cURL request
$ch = curl_init();

curl_setopt($ch, CURLOPT_HEADER, 1);
curl_setopt($ch, CURLOPT_USERPWD, $config->credentials->username . ":" . $config->credentials->password);
curl_setopt($ch, CURLOPT_URL,            $url );
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1 );
curl_setopt($ch, CURLOPT_POST,           1 );
curl_setopt($ch, CURLOPT_POSTFIELDS,     json_encode($query) );
curl_setopt($ch, CURLOPT_HTTPHEADER,     array('Content-Type: text/plain'));

$result=curl_exec ($ch);

var_dump($result);
