#!/usr/bin/env -S perl -w
use strict;
use JSON::PP;

# read the provided directory
my $dir = $ARGV[0];
my $outfile = $ARGV[1];
opendir(my $dirh, $dir) || die "couldn't open $dir";

my $cells = {};
my $DBU = 1000;

foreach my $filename (readdir($dirh)) {
    print "processing filename: $filename\n" ;
    open(my $fh, "$dir/$filename")  || die "couldn't open $dir/$filename\n";
    my $cell = {}; # data for one cell
    my $cell_name = '';
    while (<$fh>) {
        if (/^macro\s+([a-z][a-z0-9_]*)/i) {
            $cell_name = $1;
            print "cell: $cell_name\n";
            $cell->{'name'} = $cell_name;
        }
        if (/^\s*origin\s+([0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+)\s*;/i) {
            my $x = $DBU * $1;
            my $y = $DBU * $2;
            $cell->{'origin'} = {x => $x, y => $y};
        }
        if (/^\s*size\s+([0-9]+\.[0-9]+)\s+by\s+([0-9]+\.[0-9]+)\s*;/i) {
            my $w = $DBU * $1;
            my $h = $DBU * $2;
            $cell->{'size'} = {width => $w, height => $h};
        }
        if (/^\s*symmetry\s+(.+)\s+;/i) {
            my @sym = split(' ', $1);
            $cell->{'symmetry'} = \@sym;
        }
        $cell->{'site'} = 'core';
    }
    $cells->{$cell_name} = $cell;
    $fh->close();
}

my $jstr = JSON::PP->new->pretty->encode($cells);
open(my $ofh, "> $outfile") || die "couldn't open $outfile for write\n";
print $ofh $jstr;
$ofh->close();


